# Dockerfile

FROM public.ecr.aws/lambda/python:3.11

# Installs the package in the container.
ADD . ${LAMBDA_TASK_ROOT}
RUN pip install --no-cache-dir .

# Runs the application.
CMD ["store.app.aws.handler"]
