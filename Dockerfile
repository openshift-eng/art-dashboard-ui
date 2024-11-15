FROM registry.redhat.io/ubi8/python-311

WORKDIR /app

COPY . /app

USER root

RUN dnf update -y && \
    dnf install -y git && \
    python -m pip install --upgrade pip && \
    python -m pip install --no-cache-dir gunicorn -r requirements.txt

USER 1001

EXPOSE 8000

CMD ["gunicorn", "app:app", "--workers", "4", "--bind", "0.0.0.0:8000"]
