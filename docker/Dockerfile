# Dockerfile

FROM public.ecr.aws/lambda/python:3.11

WORKDIR /app

# Copies files and installs the project.
ADD . /app
RUN pip install .

# Runs the application.
CMD ["uvicorn", "store.app.main:app", "--host", "0.0.0.0", "--port", "80"]
