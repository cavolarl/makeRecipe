# Stage 1: Builder
# Use a slim, modern Python base image with the 'uv' package manager
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

# Install system dependencies required to install Playwright's browsers. 
# These won't be included in the final, lightweight image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    # The rest are Playwright's browser dependencies
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxrandr2 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables for uv and Playwright
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PLAYWRIGHT_BROWSERS_PATH=/app/playwright-browsers

# Install Python dependencies from the lock file using a cache mount for speed
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the application code into the builder
COPY . /app

# Install the project itself into the virtual environment
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked

# Install the Playwright browsers into the path specified by the ENV var
RUN /app/.venv/bin/playwright install --with-deps chromium

# Stage 2: Final Image
# Start from the same slim Python base image for a small final footprint
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

# Install only the essential *runtime* dependencies for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxrandr2 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user to run the application securely
RUN groupadd --gid 1000 app && useradd --uid 1000 --gid app --shell /bin/bash app

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder --chown=app:app /app/.venv /app/.venv

# Copy the pre-downloaded browsers from the builder into the default cache
# location for the 'app' user. This avoids needing ENV vars in the final image.
COPY --from=builder --chown=app:app /app/playwright-browsers /home/app/.cache/ms-playwright

# Copy the application source code
COPY --chown=app:app . /app

# Switch to the non-root user
USER app

# Add the virtual environment's bin directory to the system's PATH
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# The command to run the application
CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --log-level debug makeRecipe.wsgi"]
