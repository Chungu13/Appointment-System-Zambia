#!/bin/bash
cd /app
celery -A beautybook worker --loglevel=info
