FROM registry.redhat.io/ubi8/python-311

WORKDIR /app

COPY . /app

USER root

RUN wget -qO- https://astral.sh/uv/install.sh | sh
ENV PATH="$HOME/.local/bin/:$PATH"

RUN dnf update -y && \
    dnf install -y git && \
    uv pip install --upgrade pip && \
    uv pip install --no-cache-dir gunicorn -r requirements.txt

USER 1001

EXPOSE 8000

CMD ["gunicorn", "app:app", "--workers", "4", "--bind", "0.0.0.0:8000"]
