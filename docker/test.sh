# Script for testing the production docker container.

# Gets the login password for the AWS ECR and logs in to the ECR.
aws ecr get-login-password --profile prod --region us-east-1 |
    docker login --username AWS --password-stdin 725596835855.dkr.ecr.us-east-1.amazonaws.com

# Pulls the latest docker container.
docker pull 725596835855.dkr.ecr.us-east-1.amazonaws.com/store:latest

# Runs the docker container.
docker run \
    -P \
    --env-file local_docker.env \
    725596835855.dkr.ecr.us-east-1.amazonaws.com/store:latest
