
from prefect import flow
from prefect.docker import DockerImage
from vggt_s3_task import vggt_process_images_from_s3

if __name__ == "__main__":
    # Deploy the VGGT image processing workflow
    vggt_process_images_from_s3.deploy(
        name="vggt-s3-processor",
        work_pool_name="my-docker-pool",
        image=DockerImage(
            name="workstream-runner",
            # tag="latest",
            dockerfile="test.Dockerfile"
        ),
        job_variables={
            "network_mode": "host",
            "env": {
                "PREFECT_LOGGING_LEVEL": "INFO"
            }
        },
        push=False,
        build=True,
        description="Process images from S3 with VGGT and save 3D results back to S3",
    )