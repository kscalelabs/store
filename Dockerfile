FROM rust:1.78

WORKDIR /usr/src/kscale-store
COPY . .

RUN cargo install --path .

EXPOSE 3000

CMD ["kscale-store"]
