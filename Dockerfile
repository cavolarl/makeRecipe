# Install uv
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

# Change the working directory to the `app` directory
WORKDIR /app

# Environment optimizations
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project into the image and install project
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Stage 2: Final image
FROM python:3.13-slim-bookworm

# Add a non-root user
RUN groupadd --gid 1000 app && useradd --uid 1000 --gid app --shell /bin/bash app

# Change dir
WORKDIR /app

# Copy only the virtual environment from builder
COPY --from=builder --chown=app:app /app/.venv /app/.venv

# Copy source code
COPY --chown=app:app . /app

# Install Playwright and dependencies
RUN playwright install --with-deps

# Switch to non-root user
USER app

# Add venv to PATH for direct execution (no uv needed)
ENV PATH="/app/.venv/bin:$PATH"

# Expose port 8000
EXPOSE 8000

# Run migrations at startup, then start gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --log-level debug makeRecipe.wsgi"]
