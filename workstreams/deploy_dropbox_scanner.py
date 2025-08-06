from prefect import flow
from dropbox_scanner import scan_dropbox

if __name__ == "__main__":
    # Deploy the dropbox scanner workflow using serve for local process
    scan_dropbox.serve(
        name="dropbox-scanner",
        description="Scan MinIO dropbox directory for new files and process them"
    )