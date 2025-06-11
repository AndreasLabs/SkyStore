from prefect import flow
from prefect.docker import DockerImage
from vggt_s3_task import vggt_process_images_from_s3

if __name__ == "__main__":
    vggt_process_images_from_s3.deploy(
        name="vggt-s3-processor",
        work_pool_name="my-docker-pool",
        image=DockerImage(
            name="workstream-runner",
            # tag="latest",
            dockerfile="test.Dockerfile"
        ),
        job_variables={"network_mode": "host"},
        push=False,
        build=True
    )