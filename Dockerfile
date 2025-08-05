# Build stage - includes heavy dependencies for browser installation
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

# Install Playwright browser dependencies (not needed in final image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    libgbm1 fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxrandr2 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# Optimize uv for production builds
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PLAYWRIGHT_BROWSERS_PATH=/app/playwright-browsers

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked

# Pre-download browsers to avoid runtime downloads
RUN /app/.venv/bin/playwright install --with-deps chromium

# Runtime stage - minimal dependencies for smaller final image
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

# Install only runtime dependencies for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgbm1 fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxrandr2 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Security: run as non-root user
RUN groupadd --gid 1000 app && useradd --uid 1000 --gid app --shell /bin/bash app

WORKDIR /app

# Copy pre-built environment and browsers from build stage
COPY --from=builder --chown=app:app /app/.venv /app/.venv
# Place browsers in user's cache to avoid ENV vars in runtime
COPY --from=builder --chown=app:app /app/playwright-browsers /home/app/.cache/ms-playwright
COPY --chown=app:app . /app

USER app
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --log-level debug makeRecipe.wsgi"]