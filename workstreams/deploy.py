from prefect import flow
from prefect.docker import DockerImage
from hello import main

if __name__ == "__main__":
    main.deploy(
        name="test-hello",
        work_pool_name="my-docker-pool",
        image=DockerImage(
            name="workstream-runner",
            tag="latest",
           # dockerfile="Dockerfile"
            
        ),
        push=False,
        build=True
    ) 