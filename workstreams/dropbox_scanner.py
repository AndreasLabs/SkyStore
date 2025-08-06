"""Prefect flow for scanning dropbox and creating assets."""
import os
import asyncio
from prefect import flow, task, get_run_logger
from prefect.cache_policies import NO_CACHE
from prefect.context import get_run_context
import boto3
import httpx
from botocore.client import Config
import logging
import mimetypes
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Local dev config
MINIO_CONFIG = {
    'endpoint': 'localhost:9000',
    'access_key': 'minioadmin',
    'secret_key': 'minioadmin',
    'bucket': 'skystore'
}

API_CONFIG = {
    'url': 'http://localhost:4151',
    'token': 'test_token'  # Replace with your token
}

@task(cache_policy=NO_CACHE, 
      tags=["minio", "storage"],
      retries=3,
      retry_delay_seconds=5,
      log_prints=True)
def get_s3():
    """Get S3 client for local MinIO."""
    logger = get_run_logger()
    logger.info(f"Connecting to MinIO at {MINIO_CONFIG['endpoint']}")
    
    client = boto3.client(
        's3',
        endpoint_url=f"http://{MINIO_CONFIG['endpoint']}",
        aws_access_key_id=MINIO_CONFIG['access_key'],
        aws_secret_access_key=MINIO_CONFIG['secret_key'],
        region_name="us-east-1",
        config=Config(signature_version='s3v4')
    )
    
    # Test connection
    try:
        client.head_bucket(Bucket=MINIO_CONFIG['bucket'])
        logger.info(f"Successfully connected to bucket: {MINIO_CONFIG['bucket']}")
    except Exception as e:
        logger.error(f"Failed to connect to bucket: {e}")
        raise
        
    return client

@task(cache_policy=NO_CACHE, 
      tags=["minio", "storage"],
      retries=2,
      log_prints=True)
def list_files(s3_client: boto3.client):
    """List all files in dropbox directories."""
    logger = get_run_logger()
    prefix = "dropbox/"
    files = []
    
    try:
        logger.info(f"Listing files in bucket '{MINIO_CONFIG['bucket']}' with prefix '{prefix}'")
        paginator = s3_client.get_paginator('list_objects_v2')
        
        for page in paginator.paginate(Bucket=MINIO_CONFIG['bucket'], Prefix=prefix, Delimiter='/'):
            # Process common prefixes (folders)
            if 'CommonPrefixes' in page:
                for prefix_obj in page['CommonPrefixes']:
                    folder_prefix = prefix_obj.get('Prefix')
                    logger.info(f"Found folder: {folder_prefix}")
                    
                    # List files in this subfolder
                    for subpage in paginator.paginate(Bucket=MINIO_CONFIG['bucket'], Prefix=folder_prefix, Delimiter=''):
                        if 'Contents' in subpage:
                            for obj in subpage['Contents']:
                                key = obj['Key']
                                # Skip directories and special files
                                if (not key.endswith('/.keep') and 
                                    not key.endswith('/') and 
                                    '/_failed/' not in key and 
                                    '/_skipped/' not in key):
                                    files.append({
                                        'key': key,
                                        'size': obj['Size'],
                                        'last_modified': obj['LastModified']
                                    })
                                    logger.info(f"Found file: {key} ({obj['Size']} bytes)")
                                    print(f"Processing: {key}")
            
            # Process files in the root of the prefix
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    # Skip directories and special files
                    if (not key.endswith('/.keep') and 
                        not key.endswith('/') and 
                        '/_failed/' not in key and 
                        '/_skipped/' not in key):
                        files.append({
                            'key': key,
                            'size': obj['Size'],
                            'last_modified': obj['LastModified']
                        })
                        logger.info(f"Found file: {key} ({obj['Size']} bytes)")
                        print(f"Processing: {key}")
                        
        logger.info(f"Total files found: {len(files)}")
        
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise
    
    return files

@task(tags=["api", "asset"],
      retries=3,
      retry_delay_seconds=10,
      log_prints=True)
def create_asset(file_info: dict):
    """Create an asset record for a file."""
    logger = get_run_logger()
    file_path = file_info['key']
    
    try:
        # Get user ID from path (dropbox/user_id/...)
        user_id = file_path.split('/')[1]
        
        # Basic file info
        filename = os.path.basename(file_path)
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        logger.info(f"Creating asset for {filename}")
        logger.debug(f"File details: type={mime_type}, size={file_info['size']} bytes, path={file_path}")
        print(f"Processing file: {filename}")  # Will be logged due to log_prints=True
        
        # Create asset using httpx in synchronous mode
        with httpx.Client(
            base_url=API_CONFIG['url'],
            headers={'Authorization': f"Bearer {API_CONFIG['token']}"},
            timeout=30.0
        ) as client:
            response = client.post(
                '/assets/create-from-existing',
                json={
                    'stored_path': f"{file_path}",
                    'owner_uuid': user_id,
                    'uploader_uuid': user_id
                }
            )
            
            if response.is_success:
                logger.info(f"✅ Created asset for {filename}")
                logger.debug(f"Asset creation response: {response.json()}")
                result = {
                    'success': True,
                    'filename': filename,
                    'asset_id': response.json().get('data', {}).get('uuid')
                }
                # Print the result of creating a new asset
                print(f"New asset created: {result}")
                return result
            else:
                logger.error(f"❌ Failed to create asset for {filename}: {response.text}")
                result = {
                    'success': False,
                    'filename': filename,
                    'error': response.text
                }
                print(f"Failed to create asset: {result}")
                return result
            
    except Exception as e:
        logger.error(f"❌ Error processing {file_path}: {e}")
        result = {
            'success': False,
            'filename': os.path.basename(file_path),
            'error': str(e)
        }
        print(f"Error creating asset: {result}")
        return result

@flow(name="Dropbox Scanner",
      description="Scans MinIO dropbox folders and creates assets",
      version="1.0.0",
      log_prints=True)
def scan_dropbox():
    """Scan dropbox directories and create assets."""
    logger = get_run_logger()
    flow_start_time = datetime.now()
    
    try:
        logger.info("🚀 Starting dropbox scan flow")
        logger.info(f"MinIO endpoint: {MINIO_CONFIG['endpoint']}")
        logger.info(f"API endpoint: {API_CONFIG['url']}")
        
        # List all files
        s3 = get_s3()
        files = list_files(s3)
        
        if not files:
            logger.info("No files found to process")
            return {
                'success': True,
                'files_processed': 0,
                'duration': (datetime.now() - flow_start_time).total_seconds()
            }
            
        logger.info(f"Found {len(files)} files to process")
        
        # Process files in parallel using Prefect tasks
        futures = []
        for file_info in files:
            future = create_asset.submit(file_info)
            futures.append(future)
            
        # Wait for all tasks to complete and get results
        results = []
        for future in futures:
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logger.error(f"Task failed: {e}")
                results.append({
                    'success': False,
                    'error': str(e)
                })
            
        # Analyze results
        successes = [r for r in results if r and r.get('success', False)]
        failures = [r for r in results if r and not r.get('success', False)]
        
        # Log summary
        duration = (datetime.now() - flow_start_time).total_seconds()
        logger.info("📊 Flow Summary:")
        logger.info(f"Total files processed: {len(files)}")
        logger.info(f"Successful assets created: {len(successes)}")
        logger.info(f"Failed asset creations: {len(failures)}")
        logger.info(f"Duration: {duration:.2f} seconds")
        
        if failures:
            logger.warning("Failed files:")
            for f in failures:
                logger.warning(f"  - {f.get('filename')}: {f.get('error')}")
        
        return {
            'success': len(failures) == 0,
            'files_processed': len(files),
            'successful_assets': len(successes),
            'failed_assets': len(failures),
            'duration': duration
        }
        
    except Exception as e:
        logger.error(f"❌ Fatal error in flow: {e}")
        raise

if __name__ == "__main__":
    scan_dropbox()