# Dockerfile

FROM public.ecr.aws/lambda/python:3.11

WORKDIR /app

# Installs the package in the container.
ADD . /app
RUN pip install --no-cache-dir .

# Runs the application.
CMD ["store.app.aws.handler"]
