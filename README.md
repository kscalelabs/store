The source for the K-Scale store.

# Setup process

## Dependencies

- Stable Rust
- PostgreSQL 16 (earlier versions will likely work)
- NGINX

## Conventions

- ~/.config vs $XDG_CONFIG_HOME: Whenever the documentation writes ~/.config, it really means "$XDG_CONFIG_HOME, but fall back to ~/.config if the variable is not set", since this is what the code does.

## Installation

Run

    cargo install --git https://github.com/kscalelabs/store

to install the repository. (Note: the link should be whatever the link to this repository is. If you have cloned this repository, assuming you have `cd`ed into the main directory, run `cargo install --path .` instead.)

## Initialization

First we start by setting some environment variables (mass import them from a .env if running locally; see https://stackoverflow.com/questions/19331497/set-environment-variables-from-file-of-key-value-pairs). You will want to set

```
DOMAIN              The domain you are hosting your website on

PORT                The port you wish to host the website on

POSTGRES_HOST       The IP address of the machine you wish to host Postgres on (if it's the same machine as the server, use localhost)
POSTGRES_DBNAME     Database name in Postgres
POSTGRES_USER
POSTGRES_PASSWORD   Password to Postgres user

MAIL_RELAY          e.g. smtp.gmail.com
MAIL_NAME           The display name on your email address
MAIL_EMAIL          Your noreply email address
MAIL_PASSWORD       Your noreply email's password. Note for Gmail you will need an app password: https://myaccount.google.com/u/1/apppasswords
```

This includes information about the Postgres database, which you must make yourself through the `psql` command line utility.

After setting up the Postgres database, run

    init-database

to create all tables and types in the Postgres database.

Now you can run

    kscale-store

to start up the site. It is strongly advised you create a daemon to keep the process running.

## NGINX Configuration

You need to copy everything in the `static/` directory (the CSS style and the favicon) onto your machine. For the sake of this setup tutorial, say you copied all the static files to the `/STATIC` directory. Note `/STATIC` must be an absolute filepath.

Here is a sample NGINX configuration you can use. It's based on the site being bound to port 3000.

```nginx
events {}
http {
	types {
		text/css	css;
		image/svg+xml	svg;
	}
	server {
		server_name WEBSITE-DOMAIN;
		location / {
			root /STATIC;
			try_files $uri @proxy;
		}
		location @proxy {
			proxy_pass http://127.0.0.1:3000;
		}
	}
}
```

To use HTTP/2 (requires SSL to be set up, I recommend using Certbot), include
the following line in the server block:

	listen 443 ssl http2;

In case you already have

	listen 443 ssl;

you just need to add http2 to the end of that line.
