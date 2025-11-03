# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml ./
COPY src ./src

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY src ./src

# Create non-root user
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 8001

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["fastapi", "run", "src/merlin/main.py", "--host", "0.0.0.0", "--port", "8001"]
