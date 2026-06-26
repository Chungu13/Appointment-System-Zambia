#!/bin/bash
cd /app
celery -A beautybook beat --loglevel=info
