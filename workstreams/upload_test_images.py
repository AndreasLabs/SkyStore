#!/usr/bin/env python3
"""
Script to upload test images to MinIO for VGGT processing.
"""
import boto3
from botocore.client import Config
import logging
import sys
import os
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("upload_test_images")

def upload_images_to_minio(
    image_dir: str,
    bucket_name: str = "skystore",
    s3_prefix: str = "test_images",
    endpoint_url: str = "http://localhost:4164",
    access_key: str = "minioadmin",
    secret_key: str = "minioadmin"
):
    """
    Upload test images to MinIO.
    
    Args:
        image_dir: Directory containing images to upload
        bucket_name: Name of the MinIO bucket
        s3_prefix: Prefix for S3 keys (directory in S3)
        endpoint_url: MinIO endpoint URL
        access_key: MinIO access key
        secret_key: MinIO secret key
    """
    # Check if directory exists
    if not os.path.exists(image_dir) or not os.path.isdir(image_dir):
        logger.error(f"Image directory '{image_dir}' does not exist or is not a directory.")
        return False
    
    # Get list of image files
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.tif', '*.tiff']:
        image_files.extend(Path(image_dir).glob(ext))
        image_files.extend(Path(image_dir).glob(ext.upper()))
    
    if not image_files:
        logger.error(f"No image files found in '{image_dir}'.")
        return False
    
    logger.info(f"Found {len(image_files)} image files to upload.")
    
    try:
        # Create S3 client
        logger.info(f"Connecting to MinIO at {endpoint_url}")
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
        if bucket_name not in existing_buckets:
            logger.error(f"Bucket '{bucket_name}' does not exist. Please create it first.")
            return False
        
        # Upload images
        uploaded_files = []
        for image_file in image_files:
            s3_key = f"{s3_prefix}/{image_file.name}"
            logger.info(f"Uploading {image_file} to s3://{bucket_name}/{s3_key}")
            
            s3_client.upload_file(
                str(image_file),
                bucket_name,
                s3_key
            )
            uploaded_files.append(s3_key)
        
        logger.info(f"Successfully uploaded {len(uploaded_files)} images to MinIO.")
        
        # Print the S3 paths that can be used in the VGGT processor
        logger.info("S3 paths for use in VGGT processor:")
        print("\ns3_image_paths = [")
        for path in uploaded_files:
            print(f"    \"{path}\",")
        print("]")
        
        return True
        
    except Exception as e:
        logger.error(f"Error uploading images: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Upload test images to MinIO for VGGT processing')
    parser.add_argument('image_dir', help='Directory containing images to upload')
    parser.add_argument('--bucket', default='skystore', help='Name of the MinIO bucket')
    parser.add_argument('--prefix', default='test_images', help='Prefix for S3 keys (directory in S3)')
    parser.add_argument('--endpoint', default='http://localhost:4164', help='MinIO endpoint URL')
    parser.add_argument('--access-key', default='minioadmin', help='MinIO access key')
    parser.add_argument('--secret-key', default='minioadmin', help='MinIO secret key')
    
    args = parser.parse_args()
    
    success = upload_images_to_minio(
        image_dir=args.image_dir,
        bucket_name=args.bucket,
        s3_prefix=args.prefix,
        endpoint_url=args.endpoint,
        access_key=args.access_key,
        secret_key=args.secret_key
    )
    
    if success:
        logger.info("Image upload completed successfully.")
        sys.exit(0)
    else:
        logger.error("Image upload failed.")
        sys.exit(1) 