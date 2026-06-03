.PHONY: venv lint fix run docker-base docker-build docker-run check-namespace check-secrets deploy deploy-setup deploy-base deploy-all

venv:
	uv venv --python 3.11 --clear
	uv sync --active

lint:
	uv run ruff check --output-format concise
	uv run ruff format --check

fix:
	uv run ruff check --fix
	uv run ruff format

run:
	ART_DASH_DEV=1 uv run python app.py

docker-base:
	podman build -f docker/Dockerfile.base -t art-build-failures:base .

docker-build:
	podman build -f docker/Dockerfile -t art-build-failures:latest .

docker-run:
	podman run -p 8080:8080 -e REDIS_SERVER_PASSWORD art-build-failures:latest

check-namespace:
	@test -n "$$OPENSHIFT_NAMESPACE" || (echo "Error: OPENSHIFT_NAMESPACE not set" && exit 1)

check-secrets:
	@test -n "$$REDIS_PASSWORD" || (echo "Error: REDIS_PASSWORD not set" && exit 1)

deploy: check-namespace
	ansible-playbook ansible/update.yaml

deploy-setup: check-namespace check-secrets
	ansible-playbook ansible/setup.yaml

deploy-base: check-namespace
	ansible-playbook ansible/build-base.yaml

deploy-all: check-namespace check-secrets
	ansible-playbook ansible/deploy.yaml
