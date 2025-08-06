import os
from prefect import flow, task
from prefect.cache_policies import NO_CACHE
import boto3
from botocore.client import Config
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dropbox_scanner")

@task(cache_policy=NO_CACHE)  # Disable caching for S3 client creation
def setup_s3_client() -> boto3.client:
    """Set up and return an S3 client connected to MinIO."""
    return boto3.client(
        's3',
        endpoint_url=f"http://{os.environ.get('MINIO_ENDPOINT', 'localhost')}:{os.environ.get('MINIO_PORT', '9000')}",
        aws_access_key_id=os.environ.get('MINIO_ACCESS_KEY', 'minioadmin'),
        aws_secret_access_key=os.environ.get('MINIO_SECRET_KEY', 'minioadmin'),
        region_name="us-east-1",
        config=Config(
            signature_version='s3v4',
            # Disable checksum validation to avoid issues with MinIO
            response_checksum_validation="when_required",
            request_checksum_calculation="when_required"
        )
    )

@task(cache_policy=NO_CACHE)  # Disable caching for file listing
def list_dropbox_files(s3_client: boto3.client, bucket_name: str = "skystore") -> list[str]:
    """List all files in all user dropbox directories recursively."""
    prefix = "dropbox/"
    files = []
    
    try:
        # Use a simpler approach with list_objects_v2 directly
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix,
            # Set a higher MaxKeys for efficiency
            MaxKeys=1000
        )
        
        while True:
            # Process objects in current response
            if 'Contents' in response:
                # Debug output of found objects
                print(response['Contents'])
                for obj in response['Contents']:
                    key = obj['Key']
                    # Skip .keep files, directories, and special folders
                    if (not key.endswith('/.keep') and 
                        not key.endswith('/') and 
                        '/_failed/' not in key and 
                        '/_skipped/' not in key):
                        files.append(key)
                        logger.info(f"Found file: {key}")
            
            # Check if there are more objects to fetch
            if not response.get('IsTruncated'):
                break
                
            # Get next batch of objects
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix,
                MaxKeys=1000,
                ContinuationToken=response['NextContinuationToken']
            )
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise
    
    return files

@task
def process_file(file_path: str):
    """Process a single file from the dropbox."""
    logger.info(f"Processing file: {file_path}")
    # For now, just print the file path
    print(f"Processing: {file_path}")

@flow(name="Dropbox Scanner")
def scan_dropbox(bucket_name: str = "skystore") -> list[str]:
    """Scan all dropbox directories for files."""
    logger.info("Starting dropbox scan")
    
    # Set up client and scan for files
    s3_client = setup_s3_client()
    files = list_dropbox_files(s3_client, bucket_name)
    
    logger.info(f"Found {len(files)} files in dropbox")
    
    # Spawn a task for each file
    for file_path in files:
        process_file.submit(file_path)
    
    return files

if __name__ == "__main__":
    files = scan_dropbox()
    print("\nFiles found:")
    for file in files:
        print(f"  {file}")