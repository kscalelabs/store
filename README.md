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

Run

    init-config

to initialize `~/.config/kscale-store/config.toml`.

Afterwards, edit `~/.config/kscale-store/config.toml` and fill in the appropriate variables for each parameter. This includes information about the Postgres database, which you must make yourself through the `psql` command line utility.

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
