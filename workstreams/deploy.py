from prefect import flow
from hello import main

if __name__ == "__main__":
    main.serve(
        name="test-hello",
        description="Test hello world deployment"
    )