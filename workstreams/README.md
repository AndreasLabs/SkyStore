# SkyStore Prefect Workstreams

This directory contains Prefect workstreams for the SkyStore project.

## VGGT S3 Processor

The VGGT S3 Processor is a Prefect task that processes images from a MinIO S3 bucket using the VGGT (Visual Geometry Grounded Transformer) model and saves the results back to S3.

### Features

- Downloads images from a MinIO S3 bucket
- Processes images with VGGT to extract 3D information:
  - Camera extrinsic and intrinsic parameters
  - Depth maps
  - Point maps
  - 3D point clouds
- Saves all results back to the MinIO S3 bucket as PyTorch tensors (.pt files)

### Prerequisites

The following dependencies are required:

- Python 3.12+
- Prefect 3.4.5+
- PyTorch 2.3.1
- torchvision 0.18.1
- numpy
- Pillow
- huggingface_hub
- boto3 and botocore
- VGGT (installed from the GitHub repository)

All dependencies are automatically installed when building the Docker image using the provided `Dockerfile` and `requirements.txt`.

### Setup

#### 1. Build the Docker Image

Build the Docker image with all dependencies:

```bash
cd workstreams
docker build -t workstream-runner .
```

#### 2. MinIO Setup

The Docker image includes an initialization script that will automatically:

- Create the `skystore` bucket in MinIO if it doesn't exist
- Create the necessary directories (`test_images` and `vggt_results`)

To run this initialization script manually:

```bash
python init_minio.py --endpoint http://localhost:4164 --bucket skystore
```

#### 3. Uploading Test Images

Use the included upload script to add test images to MinIO:

```bash
python upload_test_images.py /path/to/your/images --endpoint http://localhost:4164 --bucket skystore
```

This script will:
- Upload all images from the specified directory to MinIO
- Print out the S3 paths that can be used in the VGGT processor

The script automatically handles various image formats (jpg, jpeg, png, tif, tiff) and prints the list of S3 paths in a format that can be directly copied into your test script.

### Usage

#### 1. Deploying the Flow

Deploy the flow using:

```bash
cd workstreams
python deploy_vggt.py
```

#### 2. Running the Flow

You can run the flow from the Prefect UI or using the Prefect CLI:

```bash
prefect deployment run vggt-s3-processor/vggt-s3-processor
```

You'll need to provide the following parameters:

- `bucket_name`: The name of the MinIO bucket (default: "skystore")
- `s3_image_paths`: List of paths to images in the bucket
- `output_prefix`: Prefix for the output files in the bucket
- `minio_endpoint`: MinIO server endpoint (default: "minio")
- `minio_port`: MinIO server port (default: 9000)
- `minio_access_key`: MinIO access key (default: "minioadmin")
- `minio_secret_key`: MinIO secret key (default: "minioadmin")
- `use_point_map`: Whether to use point map instead of depth map for 3D points (default: False)

#### 3. Local Testing

You can test the flow locally without deploying it by running:

```bash
python test_vggt_s3.py
```

This will run the flow with example parameters, connecting to MinIO running on localhost.

### Output

The flow outputs a dictionary mapping result types to their S3 paths. The results include:

- `extrinsic`: Camera extrinsic parameters
- `intrinsic`: Camera intrinsic parameters
- `depth_map`: Depth maps for each image
- `depth_conf`: Confidence scores for the depth maps
- `point_map`: Point maps for each image
- `point_conf`: Confidence scores for the point maps
- `final_point_map`: Final 3D point cloud (either from point map or unprojected from depth map)
- `final_point_conf`: Confidence scores for the final 3D point cloud

All outputs are saved as PyTorch tensor files (.pt) in the specified output prefix in the MinIO bucket.

### Notes

- The MinIO server must be running and accessible from the Prefect worker.
- The default MinIO endpoint is "minio" for use in Docker Compose.
- For local testing, use "localhost" as the endpoint and the mapped port (4164).
- The Docker image automatically tries to connect to MinIO at startup and create the necessary bucket and directories.
- If you're running on a machine with an NVIDIA GPU (Ampere or newer), the code will automatically use BFloat16 precision for better performance.
- Detailed logging is included throughout the process for easier debugging.
