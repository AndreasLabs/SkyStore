

    FROM prefecthq/prefect:3.4.5-python3.12
COPY requirements.txt /opt/prefect/workstreams/requirements.txt
RUN apt-get update && apt-get install -y git && \
    git clone https://github.com/facebookresearch/vggt.git /opt/vggt && \
    cd /opt/vggt && pip install -e .
RUN python -m pip install -r /opt/prefect/workstreams/requirements.txt
COPY . /opt/prefect/workstreams/
WORKDIR /opt/prefect/workstreams/
