"""Test script for scanning dropbox and creating assets."""
import os
import sys
import asyncio
import boto3
import httpx
import logging
import mimetypes
from botocore.client import Config

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

def get_s3():
    """Get S3 client for local MinIO."""
    logger.info(f"Connecting to MinIO at {MINIO_CONFIG['endpoint']}")
    return boto3.client(
        's3',
        endpoint_url=f"http://{MINIO_CONFIG['endpoint']}",
        aws_access_key_id=MINIO_CONFIG['access_key'],
        aws_secret_access_key=MINIO_CONFIG['secret_key'],
        region_name="us-east-1",
        config=Config(signature_version='s3v4')
    )
def list_files():
    """List all files in dropbox directories."""
    s3 = get_s3()
    prefix = "dropbox/"
    files = []
    
    try:
        logger.info(f"Listing files in bucket '{MINIO_CONFIG['bucket']}' with prefix '{prefix}'")
        paginator = s3.get_paginator('list_objects_v2')
        
        for page in paginator.paginate(Bucket=MINIO_CONFIG['bucket'], Prefix=prefix, Delimiter=''):
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
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise
    
    return files

async def create_asset(client: httpx.AsyncClient, file_info: dict):
    """Create an asset record for a file."""
    file_path = file_info['key']
    try:
        # Get user ID from path (dropbox/user_id/...)
        user_id = file_path.split('/')[1]
        
        # Basic file info
        filename = os.path.basename(file_path)
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        logger.info(f"Creating asset for {filename} (type: {mime_type}, size: {file_info['size']} bytes)")
        
        # Create asset
        response = await client.post(
            '/assets/create-from-existing',
            json={
                'stored_path': f"s3://{MINIO_CONFIG['bucket']}/{file_path}",
                'file_name': filename,
                'file_type': mime_type,
                'size_bytes': file_info['size'],
                'owner_uuid': user_id,
                'uploader_uuid': user_id
            }
        )
        
        if response.is_success:
            logger.info(f"Created asset for {filename}")
        else:
            logger.error(f"Failed to create asset for {filename}: {response.text}")
            
    except Exception as e:
        logger.error(f"Error processing {file_path}: {e}")

async def main():
    """Main function."""
    try:
        # List all files
        files = list_files()
        if not files:
            logger.info("No files found")
            return
            
        logger.info(f"Found {len(files)} files to process")
        
        # Create assets
        async with httpx.AsyncClient(
            base_url=API_CONFIG['url'],
            headers={'Authorization': f"Bearer {API_CONFIG['token']}"},
            timeout=30.0
        ) as client:
            # Process all files concurrently
            await asyncio.gather(*[
                create_asset(client, file_info) 
                for file_info in files
            ])
            
        logger.info("Processing completed")
        
    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())