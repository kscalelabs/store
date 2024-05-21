# Dockerfile

FROM public.ecr.aws/lambda/python:3.11

WORKDIR /app

# Copies files and installs the project.
ADD . /app
RUN pip install --no-cache-dir '.[lambda]'

# Runs the application.
CMD ["store.app.aws.handler"]
