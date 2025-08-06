"""Create assets from files in MinIO dropbox folders."""
import os
import asyncio
import httpx
import boto3
import mimetypes
import logging
from botocore.client import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Hardcoded config for local dev
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
    return boto3.client(
        's3',
        endpoint_url=f"http://{MINIO_CONFIG['endpoint']}",
        aws_access_key_id=MINIO_CONFIG['access_key'],
        aws_secret_access_key=MINIO_CONFIG['secret_key'],
        region_name="us-east-1",
        config=Config(signature_version='s3v4')
    )

async def create_asset(client: httpx.AsyncClient, file_info: dict, user_id: str):
    """Create an asset record for a file."""
    try:
        # Basic file info
        filename = os.path.basename(file_info['key'])
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        # Create asset
        response = await client.post(
            '/assets/create-from-existing',
            json={
                'stored_path': file_info['key'],
                'owner_uuid': user_id,
                'uploader_uuid': user_id,
                'flight_uuid': None  # Optional flight UUID
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Created asset for {filename}")
        else:
            logger.error(f"Failed to create asset for {filename}: {response}")
            
    except Exception as e:
        logger.error(f"Error processing {filename}: {e}")

async def main():
    """Main function."""
    s3 = get_s3()
    
    # List files in dropbox
    prefix = "dropbox/"
    logger.info(f"Listing files in {prefix}")
    
    files = []
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=MINIO_CONFIG['bucket'], Prefix=prefix):
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                # Skip directories and special files
                if not key.endswith('/') and not key.endswith('/.keep'):
                    files.append({
                        'key': key,
                        'size': obj['Size']
                    })
                    logger.info(f"Found: {key} ({obj['Size']} bytes)")

    if not files:
        logger.info("No files found")
        return

    # Create assets
    async with httpx.AsyncClient(
        base_url=API_CONFIG['url'],
        headers={'Authorization': f"Bearer {API_CONFIG['token']}"},
        timeout=30.0
    ) as client:
        # Get user ID from path (assuming dropbox/user_id/...)
        for file in files:
            user_id = file['key'].split('/')[1]  # dropbox/user_id/...
            await create_asset(client, file, user_id)

if __name__ == "__main__":
    asyncio.run(main())