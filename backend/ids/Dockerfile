FROM python:3.11-slim

# System deps (improve build reliability for ML libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (leverages Docker layer caching)
COPY backend/ids/requirements.txt /app/requirements.txt

# Install Python deps
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the backend code
COPY backend /app/backend

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "backend.ids.serve.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
