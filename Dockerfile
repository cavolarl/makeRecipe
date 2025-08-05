# Stage 1: Builder with Playwright installation
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

# Install system dependencies needed for Playwright in one layer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Environment optimizations
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PLAYWRIGHT_BROWSERS_PATH=/app/playwright-browsers

# Install Python dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project and install
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Install Playwright browsers with cache mount
RUN --mount=type=cache,target=/tmp/playwright-cache \
    PLAYWRIGHT_BROWSERS_PATH=/app/playwright-browsers \
    /app/.venv/bin/playwright install --with-deps chromium

# Stage 2: Final optimized image
FROM python:3.13-slim-bookworm

# Install only runtime dependencies for Playwright
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Add non-root user
RUN groupadd --gid 1000 app && useradd --uid 1000 --gid app --shell /bin/bash app

WORKDIR /app

# Copy virtual environment and playwright browsers from builder
COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/playwright-browsers /home/app/.cache/ms-playwright

# Copy source code
COPY --chown=app:app . /app

# Switch to non-root user
USER app

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --log-level debug makeRecipe.wsgi"]