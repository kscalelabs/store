# Specifies a local environment versus production environment.
export ROBOLIST_ENVIRONMENT=local

# For AWS
export AWS_DEFAULT_REGION='us-east-1'
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_ENDPOINT_URL_S3='http://127.0.0.1:4566'

# For letting the frontend know the backend URL.
export REACT_APP_BACKEND_URL='http://127.0.0.1:8080'

# For SMTP
export SMTP_HOST='smtp.gmail.com'
export SMTP_SENDER_EMAIL=''
export SMTP_PASSWORD=''
export SMTP_SENDER_NAME=''
export SMTP_USERNAME=''

# For Github OAuth
export GITHUB_CLIENT_ID='Ov23li6e55k9m0bxXMVU'
export GITHUB_CLIENT_SECRET='34030d07df051a535bddea31fdb0d74448ee51ca'

# For Google OAuth
export GOOGLE_CLIENT_ID=''
export GOOGLE_CLIENT_SECRET=''