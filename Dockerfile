# Stage 1: Builder
FROM python:3.13.5-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final image
FROM python:3.13.5-slim

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Run migrations
RUN python manage.py migrate

# Expose port
EXPOSE 8000

# Set entrypoint
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--log-level", "debug", "makeRecipe.wsgi"]

