FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY gate/       ./gate/
COPY policies/   ./policies/
COPY main.py     ./

# Create data directory for the SQLite audit log
RUN mkdir -p /app/data

# Expose the dashboard / API port
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

