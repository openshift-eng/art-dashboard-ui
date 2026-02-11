.PHONY: venv lint fix docker-base docker-build docker-run

venv:
	uv venv --python 3.11 --clear
	uv sync --active

lint:
	uv run ruff check --select I --output-format concise
	uv run ruff format --check
	uv run ruff check --output-format concise

fix:
	uv run ruff check --select I --fix
	uv run ruff format
	uv run ruff check --fix --unsafe-fixes

docker-base:
	podman build -f docker/Dockerfile.base -t build-history-base:latest .

docker-build:
	podman build -f docker/Dockerfile -t build-history:latest .

docker-run:
	@if [ -z "$$GOOGLE_APPLICATION_CREDENTIALS" ]; then \
		echo "Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set"; \
		echo ""; \
		echo "Please set it to your GCP credentials file:"; \
		echo "  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json"; \
		echo ""; \
		echo "Or authenticate with gcloud:"; \
		echo "  gcloud auth application-default login"; \
		echo "  export GOOGLE_APPLICATION_CREDENTIALS=\$$HOME/.config/gcloud/application_default_credentials.json"; \
		exit 1; \
	fi; \
	if [ ! -f "$$GOOGLE_APPLICATION_CREDENTIALS" ]; then \
		echo "Error: Credentials file not found: $$GOOGLE_APPLICATION_CREDENTIALS"; \
		exit 1; \
	fi; \
	CREDS_DIR=$$(dirname "$$GOOGLE_APPLICATION_CREDENTIALS"); \
	CREDS_FILE=$$(basename "$$GOOGLE_APPLICATION_CREDENTIALS"); \
	echo "Running with GOOGLE_APPLICATION_CREDENTIALS=$$GOOGLE_APPLICATION_CREDENTIALS"; \
	podman run --rm -ti -p 8000:8000 --user=root \
		-e GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp/$$CREDS_FILE \
		-v "$$CREDS_DIR:/etc/secrets/gcp:ro,Z" \
		build-history:latest
