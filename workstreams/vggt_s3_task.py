from prefect import flow, task
import os
import sys
import boto3
from botocore.client import Config
import torch
from PIL import Image
from io import BytesIO
import tempfile
import shutil
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np

# Configure logging
logger = logging.getLogger("vggt_s3_task")
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# First check if VGGT is in /opt/vggt (the Docker container location)
VGGT_AVAILABLE = False
vggt_possible_paths = [
    "/opt/vggt",
    os.path.expanduser("~/vggt"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "vggt")
]

for vggt_path in vggt_possible_paths:
    if os.path.exists(vggt_path):
        logger.info(f"Found VGGT at {vggt_path}")
        if vggt_path not in sys.path:
            sys.path.append(vggt_path)
            logger.info(f"Added {vggt_path} to sys.path")
        break
    else:
        logger.warning(f"VGGT not found at {vggt_path}")

# Try to import VGGT
try:
    # Import VGGT model
    from vggt.models.vggt import VGGT
    from vggt.utils.load_fn import load_and_preprocess_images
    from vggt.utils.pose_enc import pose_encoding_to_extri_intri
    from vggt.utils.geometry import unproject_depth_map_to_point_map
    VGGT_AVAILABLE = True
    logger.info("VGGT package imported successfully")
except ImportError as e:
    logger.error(f"VGGT package import failed: {e}")
    VGGT_AVAILABLE = False


@task(name="Setup S3 Client", description="Connect to MinIO S3-compatible storage")
def setup_s3_client(
    endpoint_url: str = "http://minio:9000",
    region_name: str = "us-east-1",
    access_key: str = "minioadmin", 
    secret_key: str = "minioadmin"
) -> boto3.client:
    """
    Set up and return an S3 client connected to MinIO.
    
    Args:
        endpoint_url: The URL of the MinIO server
        region_name: AWS region name (not actually used by MinIO but required by boto3)
        access_key: MinIO access key (defaults to standard MinIO default)
        secret_key: MinIO secret key (defaults to standard MinIO default)
        
    Returns:
        boto3.client: Configured S3 client
    """
    logger.info(f"Setting up S3 client with endpoint URL: {endpoint_url}")
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region_name,
        config=Config(signature_version='s3v4')
    )
    return s3_client


@task(name="Download Images", description="Download images from S3 storage to local filesystem")
def download_images_from_s3(
    s3_client: boto3.client,
    bucket_name: str,
    s3_paths: List[str],
    local_dir: Optional[str] = None
) -> List[str]:
    """
    Download images from S3 to a local directory.
    
    Args:
        s3_client: Configured S3 client
        bucket_name: S3 bucket name
        s3_paths: List of S3 paths to download
        local_dir: Optional local directory to save images. If None, a temporary directory is created.
        
    Returns:
        List[str]: List of local file paths
    """
    if local_dir is None:
        local_dir = tempfile.mkdtemp()
    else:
        os.makedirs(local_dir, exist_ok=True)
    
    logger.info(f"Downloading {len(s3_paths)} images from bucket {bucket_name} to {local_dir}")
    local_paths = []
    
    for s3_path in s3_paths:
        filename = os.path.basename(s3_path)
        local_path = os.path.join(local_dir, filename)
        
        logger.info(f"Downloading s3://{bucket_name}/{s3_path} to {local_path}")
        s3_client.download_file(bucket_name, s3_path, local_path)
        local_paths.append(local_path)
    
    return local_paths


def check_vggt_install():
    """
    Check if VGGT is properly installed.
    
    Returns:
        bool: True if VGGT is available, False otherwise
    """
    if not VGGT_AVAILABLE:
        logger.error("VGGT package is not available. Please make sure it's installed correctly.")
        logger.error("You may need to rebuild the Docker image or install VGGT manually.")
        logger.error("The Docker build should clone VGGT to /opt/vggt and install it in development mode.")
        return False
    return True


@task(name="Load VGGT Model", description="Initialize and load the VGGT model weights")
def load_vggt_model(device: str = None) -> torch.nn.Module:
    """
    Load the VGGT model and return it.
    
    Args:
        device: Device to load the model on. If None, will use CUDA if available, otherwise CPU.
        
    Returns:
        torch.nn.Module: Loaded VGGT model
    """
    if not check_vggt_install():
        raise ImportError("VGGT package is not available. Please make sure it's installed correctly.")

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    logger.info(f"Loading VGGT model on {device}")
    
    # Determine dtype based on GPU capabilities
    if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
        dtype = torch.bfloat16
        logger.info("Using bfloat16 precision (Ampere+ GPU detected)")
    else:
        dtype = torch.float16
        logger.info("Using float16 precision")
    
    # Initialize the model and load pretrained weights using torch.hub
    logger.info("Loading VGGT model from pretrained weights using torch.hub")
    model = VGGT()
    _URL = "https://huggingface.co/facebook/VGGT-1B/resolve/main/model.pt"
    model.load_state_dict(torch.hub.load_state_dict_from_url(_URL))
    model = model.to(device)
    model.eval()
    
    return model


@task(name="VGGT Aggregation", description="Run VGGT aggregator on input images")
def run_vggt_aggregator(
    model: torch.nn.Module,
    image_paths: List[str]
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    """
    Run the VGGT aggregator on input images.
    
    Args:
        model: Loaded VGGT model
        image_paths: List of local image paths
        
    Returns:
        Tuple containing:
            - images_batch: The preprocessed images batch
            - aggregated_tokens_list: Token list from aggregator
            - ps_idx: Point sampling indices
    """
    device = next(model.parameters()).device
    logger.info(f"Running VGGT aggregator on {len(image_paths)} images on {device}")
    
    # Determine dtype based on GPU capabilities
    if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
        dtype = torch.bfloat16
    else:
        dtype = torch.float16
    
    # Load and preprocess the images
    logger.info("Loading and preprocessing images")
    images = load_and_preprocess_images(image_paths).to(device)
    
    with torch.no_grad():
        with torch.cuda.amp.autocast(dtype=dtype):
            logger.info("Running VGGT aggregator")
            # Add batch dimension for a single scene
            images_batch = images[None]
            aggregated_tokens_list, ps_idx = model.aggregator(images_batch)
    
    return images_batch, aggregated_tokens_list, ps_idx


@task(name="Predict Cameras", description="Predict camera parameters from VGGT aggregated tokens")
def predict_cameras(
    model: torch.nn.Module,
    aggregated_tokens_list: torch.Tensor,
    images_batch: torch.Tensor
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Predict camera parameters using the VGGT camera head.
    
    Args:
        model: Loaded VGGT model
        aggregated_tokens_list: Token list from aggregator
        images_batch: The preprocessed images batch
        
    Returns:
        Tuple containing:
            - extrinsic: Camera extrinsic parameters
            - intrinsic: Camera intrinsic parameters
    """
    device = next(model.parameters()).device
    
    # Determine dtype based on GPU capabilities
    if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
        dtype = torch.bfloat16
    else:
        dtype = torch.float16
    
    with torch.no_grad():
        with torch.cuda.amp.autocast(dtype=dtype):
            logger.info("Predicting camera parameters")
            pose_enc = model.camera_head(aggregated_tokens_list)[-1]
            extrinsic, intrinsic = pose_encoding_to_extri_intri(pose_enc, images_batch.shape[-2:])
    
    return extrinsic, intrinsic


@task(name="Predict Depth Maps", description="Predict depth maps from VGGT aggregated tokens")
def predict_depth_maps(
    model: torch.nn.Module,
    aggregated_tokens_list: torch.Tensor,
    images_batch: torch.Tensor,
    ps_idx: torch.Tensor
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Predict depth maps using the VGGT depth head.
    
    Args:
        model: Loaded VGGT model
        aggregated_tokens_list: Token list from aggregator
        images_batch: The preprocessed images batch
        ps_idx: Point sampling indices
        
    Returns:
        Tuple containing:
            - depth_map: Predicted depth maps
            - depth_conf: Depth confidence maps
    """
    device = next(model.parameters()).device
    
    # Determine dtype based on GPU capabilities
    if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
        dtype = torch.bfloat16
    else:
        dtype = torch.float16
    
    with torch.no_grad():
        with torch.cuda.amp.autocast(dtype=dtype):
            logger.info("Predicting depth maps")
            depth_map, depth_conf = model.depth_head(aggregated_tokens_list, images_batch, ps_idx)
    
    return depth_map, depth_conf


@task(name="Predict Point Maps", description="Predict point maps from VGGT aggregated tokens")
def predict_point_maps(
    model: torch.nn.Module,
    aggregated_tokens_list: torch.Tensor,
    images_batch: torch.Tensor,
    ps_idx: torch.Tensor
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Predict point maps using the VGGT point head.
    
    Args:
        model: Loaded VGGT model
        aggregated_tokens_list: Token list from aggregator
        images_batch: The preprocessed images batch
        ps_idx: Point sampling indices
        
    Returns:
        Tuple containing:
            - point_map: Predicted point maps
            - point_conf: Point confidence maps
    """
    device = next(model.parameters()).device
    
    # Determine dtype based on GPU capabilities
    if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
        dtype = torch.bfloat16
    else:
        dtype = torch.float16
    
    with torch.no_grad():
        with torch.cuda.amp.autocast(dtype=dtype):
            logger.info("Predicting point maps")
            point_map, point_conf = model.point_head(aggregated_tokens_list, images_batch, ps_idx)
    
    return point_map, point_conf


@task(name="Construct 3D Point Cloud", description="Construct final 3D point cloud from depth or point maps")
def construct_point_cloud(
    extrinsic: torch.Tensor,
    intrinsic: torch.Tensor,
    depth_map: torch.Tensor,
    depth_conf: torch.Tensor,
    point_map: torch.Tensor,
    point_conf: torch.Tensor,
    use_point_map: bool = False
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Construct the final 3D point cloud based on user preference.
    
    Args:
        extrinsic: Camera extrinsic parameters
        intrinsic: Camera intrinsic parameters
        depth_map: Predicted depth maps
        depth_conf: Depth confidence maps
        point_map: Predicted point maps
        point_conf: Point confidence maps
        use_point_map: Whether to use point map instead of depth map for 3D points
        
    Returns:
        Tuple containing:
            - final_point_map: Final 3D point map
            - final_point_conf: Point confidence values
    """
    logger.info(f"Constructing final 3D point cloud (use_point_map={use_point_map})")
    
    if use_point_map:
        final_point_map = point_map.squeeze(0)
        final_point_conf = point_conf.squeeze(0)
    else:
        # Unproject depth map to point map
        final_point_map = unproject_depth_map_to_point_map(
            depth_map.squeeze(0), 
            extrinsic.squeeze(0), 
            intrinsic.squeeze(0)
        )
        final_point_conf = depth_conf.squeeze(0)
    
    return final_point_map, final_point_conf


@task(name="Prepare Results", description="Prepare and format VGGT results for saving")
def prepare_results(
    extrinsic: torch.Tensor,
    intrinsic: torch.Tensor,
    depth_map: torch.Tensor,
    depth_conf: torch.Tensor,
    point_map: torch.Tensor,
    point_conf: torch.Tensor,
    final_point_map: torch.Tensor,
    final_point_conf: torch.Tensor
) -> Dict[str, Any]:
    """
    Prepare and format the VGGT results for saving.
    
    Args:
        extrinsic: Camera extrinsic parameters
        intrinsic: Camera intrinsic parameters
        depth_map: Predicted depth maps
        depth_conf: Depth confidence maps
        point_map: Predicted point maps
        point_conf: Point confidence maps
        final_point_map: Final 3D point map
        final_point_conf: Point confidence values
        
    Returns:
        Dict[str, Any]: Dictionary containing the VGGT predictions
    """
    logger.info("Preparing results for saving")
    
    # Helper function to safely move data to CPU
    def to_cpu(data):
        if hasattr(data, 'cpu'):
            return data.cpu()
        return data
    
    # Store results, safely handling both PyTorch tensors and NumPy arrays
    results = {
        "extrinsic": to_cpu(extrinsic.squeeze(0)),
        "intrinsic": to_cpu(intrinsic.squeeze(0)),
        "depth_map": to_cpu(depth_map.squeeze(0)),
        "depth_conf": to_cpu(depth_conf.squeeze(0)),
        "point_map": to_cpu(point_map.squeeze(0)),
        "point_conf": to_cpu(point_conf.squeeze(0)),
        "final_point_map": to_cpu(final_point_map),
        "final_point_conf": to_cpu(final_point_conf),
    }
    
    return results


@task(name="Save Results to S3", description="Upload VGGT processing results back to S3 storage")
def save_results_to_s3(
    s3_client: boto3.client,
    bucket_name: str,
    results: Dict[str, Any],
    output_prefix: str
) -> Dict[str, str]:
    """
    Save the VGGT results back to S3.
    
    Args:
        s3_client: Configured S3 client
        bucket_name: S3 bucket name
        results: Dictionary of VGGT results
        output_prefix: Prefix for output files in S3
        
    Returns:
        Dict[str, str]: Dictionary mapping result types to their S3 paths
    """
    logger.info(f"Saving results to S3 bucket {bucket_name} with prefix {output_prefix}")
    output_paths = {}
    
    # Save each tensor as a .pt file
    for key, data in results.items():
        with tempfile.NamedTemporaryFile(suffix='.pt') as temp_file:
            logger.info(f"Saving {key} data to temporary file")
            
            # Convert numpy array to tensor if needed
            if isinstance(data, np.ndarray):
                logger.info(f"{key} is a NumPy array, converting to tensor")
                data = torch.from_numpy(data)
            
            torch.save(data, temp_file.name)
            temp_file.flush()
            
            s3_path = f"{output_prefix}/{key}.pt"
            logger.info(f"Uploading {key} to s3://{bucket_name}/{s3_path}")
            s3_client.upload_file(temp_file.name, bucket_name, s3_path)
            output_paths[key] = s3_path
    
    return output_paths


@flow(name="VGGT Image Processing Pipeline", 
      description="Process images with VGGT model and save 3D information to S3",
      log_prints=True)
def vggt_process_images_from_s3(
    bucket_name: str,
    s3_image_paths: List[str],
    output_prefix: str,
    minio_endpoint: str = "minio",
    minio_port: int = 9000,
    minio_access_key: str = "minioadmin",
    minio_secret_key: str = "minioadmin",
    use_point_map: bool = False
) -> Dict[str, str]:
    """
    Prefect flow that processes images from S3 with VGGT and saves results back to S3.
    
    Args:
        bucket_name: S3 bucket name
        s3_image_paths: List of S3 paths to images
        output_prefix: Prefix for output files in S3
        minio_endpoint: MinIO server endpoint
        minio_port: MinIO server port
        minio_access_key: MinIO access key (defaults to standard MinIO default)
        minio_secret_key: MinIO secret key (defaults to standard MinIO default)
        use_point_map: Whether to use point map instead of depth map for 3D points
        
    Returns:
        Dict[str, str]: Dictionary mapping result types to their S3 paths
    """
    # Check if VGGT is available
    if not check_vggt_install():
        raise ImportError("VGGT package is not available. Cannot proceed with processing.")
    
    print(f"Starting VGGT processing flow for {len(s3_image_paths)} images")
    print(f"Connection to MinIO at {minio_endpoint}:{minio_port}")
    
    # STAGE 1: Set up S3 client
    endpoint_url = f"http://{minio_endpoint}:{minio_port}"
    s3_client = setup_s3_client(
        endpoint_url=endpoint_url,
        access_key=minio_access_key,
        secret_key=minio_secret_key
    )
    
    # Create a temporary directory for the images
    temp_dir = tempfile.mkdtemp()
    print(f"Created temporary directory at {temp_dir}")
    
    try:
        # STAGE 2: Download images from S3
        print("Stage 2: Downloading images from S3")
        local_image_paths = download_images_from_s3(
            s3_client=s3_client,
            bucket_name=bucket_name,
            s3_paths=s3_image_paths,
            local_dir=temp_dir
        )
        
        # STAGE 3: Load VGGT model
        print("Stage 3: Loading VGGT model")
        model = load_vggt_model()
        
        # STAGE 4: Process images with VGGT
        print("Stage 4: Processing images with VGGT")
        images_batch, aggregated_tokens_list, ps_idx = run_vggt_aggregator(
            model=model,
            image_paths=local_image_paths
        )
        
        # STAGE 5: Predict cameras
        print("Stage 5: Predicting cameras")
        extrinsic, intrinsic = predict_cameras(
            model=model,
            aggregated_tokens_list=aggregated_tokens_list,
            images_batch=images_batch
        )
        
        # STAGE 6: Predict depth maps
        print("Stage 6: Predicting depth maps")
        depth_map, depth_conf = predict_depth_maps(
            model=model,
            aggregated_tokens_list=aggregated_tokens_list,
            images_batch=images_batch,
            ps_idx=ps_idx
        )
        
        # STAGE 7: Predict point maps
        print("Stage 7: Predicting point maps")
        point_map, point_conf = predict_point_maps(
            model=model,
            aggregated_tokens_list=aggregated_tokens_list,
            images_batch=images_batch,
            ps_idx=ps_idx
        )
        
        # STAGE 8: Construct 3D point cloud
        print("Stage 8: Constructing 3D point cloud")
        final_point_map, final_point_conf = construct_point_cloud(
            extrinsic=extrinsic,
            intrinsic=intrinsic,
            depth_map=depth_map,
            depth_conf=depth_conf,
            point_map=point_map,
            point_conf=point_conf,
            use_point_map=use_point_map
        )
        
        # STAGE 9: Prepare results
        print("Stage 9: Preparing results")
        results = prepare_results(
            extrinsic=extrinsic,
            intrinsic=intrinsic,
            depth_map=depth_map,
            depth_conf=depth_conf,
            point_map=point_map,
            point_conf=point_conf,
            final_point_map=final_point_map,
            final_point_conf=final_point_conf
        )
        
        # STAGE 10: Save results back to S3
        print("Stage 10: Saving results to S3")
        output_paths = save_results_to_s3(
            s3_client=s3_client,
            bucket_name=bucket_name,
            results=results,
            output_prefix=output_prefix
        )
        
        print("VGGT processing completed successfully")
        return output_paths
    
    finally:
        # Clean up temporary directory
        print(f"Cleaning up temporary directory {temp_dir}")
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    # Print VGGT availability status
    if check_vggt_install():
        print("VGGT is properly installed and available.")
    else:
        print("VGGT is not available. Please check installation.")
        sys.exit(1)
        
    # Example usage
    bucket_name = "skystore"
    s3_image_paths = [
        "test_images/image1.jpg",
        "test_images/image2.jpg",
        "test_images/image3.jpg"
    ]
    output_prefix = "vggt_results/test_run"
    
    result_paths = vggt_process_images_from_s3(
        bucket_name=bucket_name,
        s3_image_paths=s3_image_paths,
        output_prefix=output_prefix,
        minio_access_key="minioadmin",  # Update with your actual credentials
        minio_secret_key="minioadmin"   # Update with your actual credentials
    )
    
    print("Results saved to S3:")
    for key, path in result_paths.items():
        print(f"  {key}: s3://{bucket_name}/{path}") 