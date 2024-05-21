# Dockerfile
# Elastic Beanstalk Dockerfile using Python 3.11 and FastAPI

FROM python:3.11-slim

WORKDIR /app

# Copy code and install Python dependencies.
COPY . /app
RUN pip install --no-cache-dir --upgrade .

# Run the FastAPI application.
CMD ["fastapi", "run", "store/app/main.py", "--port", "80"]
