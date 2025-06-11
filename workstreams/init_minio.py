#!/usr/bin/env python3
"""
Script to initialize the MinIO bucket for VGGT processing.
This ensures the required bucket exists before running the flows.
"""
import boto3
from botocore.client import Config
import logging
import sys
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("init_minio")

def init_minio(
    bucket_name="skystore", 
    endpoint_url="http://minio:9000", 
    access_key="minioadmin", 
    secret_key="minioadmin",
    max_retries=5,
    retry_delay=5
):
    """
    Initialize the MinIO bucket.
    
    Args:
        bucket_name: Name of the bucket to create
        endpoint_url: MinIO endpoint URL
        access_key: MinIO access key
        secret_key: MinIO secret key
        max_retries: Maximum number of connection retry attempts
        retry_delay: Delay between retry attempts in seconds
    """
    logger.info(f"Attempting to connect to MinIO at {endpoint_url}")
    
    retry_count = 0
    while retry_count < max_retries:
        try:
            # Create S3 client
            s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name="us-east-1",
                config=Config(signature_version='s3v4')
            )
            
            # Check if bucket exists
            existing_buckets = [bucket['Name'] for bucket in s3_client.list_buckets()['Buckets']]
            logger.info(f"Existing buckets: {existing_buckets}")
            
            if bucket_name in existing_buckets:
                logger.info(f"Bucket '{bucket_name}' already exists.")
            else:
                # Create bucket
                logger.info(f"Creating bucket '{bucket_name}'...")
                s3_client.create_bucket(Bucket=bucket_name)
                logger.info(f"Bucket '{bucket_name}' created successfully.")
            
            # Create test directories
            test_dirs = ["test_images", "vggt_results"]
            for dir_name in test_dirs:
                logger.info(f"Creating directory '{dir_name}/'...")
                s3_client.put_object(Bucket=bucket_name, Key=f"{dir_name}/")
                logger.info(f"Directory '{dir_name}/' created successfully.")
                
            return True
        
        except Exception as e:
            logger.warning(f"Attempt {retry_count + 1}/{max_retries} failed: {str(e)}")
            retry_count += 1
            if retry_count < max_retries:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error("Max retries reached. Could not connect to MinIO.")
                return False

if __name__ == "__main__":
    # Allow command-line arguments to override defaults
    import argparse
    
    parser = argparse.ArgumentParser(description='Initialize MinIO bucket for VGGT processing')
    parser.add_argument('--bucket', default='skystore', help='Name of the bucket to create')
    parser.add_argument('--endpoint', default='http://minio:9000', help='MinIO endpoint URL')
    parser.add_argument('--access-key', default='minioadmin', help='MinIO access key')
    parser.add_argument('--secret-key', default='minioadmin', help='MinIO secret key')
    
    args = parser.parse_args()
    
    success = init_minio(
        bucket_name=args.bucket,
        endpoint_url=args.endpoint,
        access_key=args.access_key,
        secret_key=args.secret_key
    )
    
    if success:
        logger.info("MinIO initialization completed successfully.")
        sys.exit(0)
    else:
        logger.error("MinIO initialization failed.")
        sys.exit(1) 