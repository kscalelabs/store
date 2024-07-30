# Dockerfile
# Elastic Beanstalk Dockerfile using Python 3.11 and FastAPI

FROM python:3.11-slim

WORKDIR /app

# Copy the requirements file first to leverage Docker's cache.
COPY /store/requirements.txt /app

# Install Python dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy code and install Python dependencies.
COPY . /app

# Installs the project.
RUN pip install --no-cache-dir -e .

# Expose the port that the application runs on.
EXPOSE 8080

# Run the FastAPI application.
CMD ["fastapi", "run", "store/app/main.py", "--port", "8080"]
