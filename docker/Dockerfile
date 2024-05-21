# Dockerfile

FROM public.ecr.aws/lambda/python:3.11

WORKDIR ${LAMBDA_TASK_ROOT}

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED 1

# Installs the package in the container.
COPY . .
# RUN pip install --no-cache-dir '.[dev]'
RUN pip install --no-cache-dir .

# Runs tests inside the container to make sure it built correctly.
# RUN black --diff --check store
# RUN ruff check store
# RUN python -m pytest

# Runs the application.
CMD ["store/app/aws.handler"]
