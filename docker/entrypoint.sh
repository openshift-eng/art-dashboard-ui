#!/bin/bash
exec /app/.venv/bin/gunicorn app:app --workers 4 --bind 0.0.0.0:8080
