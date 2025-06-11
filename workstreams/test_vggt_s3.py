from vggt_s3_task import vggt_process_images_from_s3

if __name__ == "__main__":
    # Example usage with MinIO running in Docker
    # Make sure these values match your local MinIO setup
    bucket_name = "skystore"
    s3_image_paths = [
        "test_images/image1.jpg",
        "test_images/image2.jpg",
        "test_images/image3.jpg"
    ]
    output_prefix = "vggt_results/test_run"
    
    # For local testing, we need to adjust the endpoint
    result_paths = vggt_process_images_from_s3(
        bucket_name=bucket_name,
        s3_image_paths=s3_image_paths,
        output_prefix=output_prefix,
        minio_endpoint="localhost",  # Use localhost for local testing
        minio_port=4164,             # Port mapping from docker-compose.yml
        minio_access_key="minioadmin",
        minio_secret_key="minioadmin",
        use_point_map=False
    )
    
    print("Results saved to S3:")
    for key, path in result_paths.items():
        print(f"  {key}: s3://{bucket_name}/{path}") 