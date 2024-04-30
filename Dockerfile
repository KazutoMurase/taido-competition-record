FROM --platform=amd64 ubuntu:22.04

SHELL ["/usr/bin/bash", "-l", "-c"]

RUN apt update && apt upgrade -y

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    gnupg2 \
    iputils-ping \
    lsb-release \
    net-tools \
    nodejs \
    npm \
    sudo \
    systemctl \
    redis-server \
    vim \
    wget

# Setup user
RUN useradd test_user
RUN echo 'test_user:test_pass' | chpasswd

# Setup postrgresql
ENV TZ=Asia/Tokyo
ENV LANG=ja_JP.UTF-8
ENV LANGUAGE=ja_JP:ja
ENV LC_ALL=ja_JP.UTF-8

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y locales-all
RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN apt-get update && apt-get install -y postgresql-16

USER postgres
RUN /etc/init.d/postgresql start && \
        psql -c "alter user postgres with encrypted password 'postgres'" && \
        psql -c "create user docker with password 'docker' superuser;" && \
        psql -c "create database docker owner docker;" && \
        psql -d docker -c "create schema authorization docker;" && \
        psql -c "create role readonly with login password 'readonly';" && \
        psql -c "grant pg_read_all_data to readonly;" && \
        psql -c "create user test_user with password 'test_pass' login superuser createdb"
RUN echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/16/main/pg_hba.conf
RUN echo "listen_addresses='*'" >> /etc/postgresql/16/main/postgresql.conf
USER root

EXPOSE 5432

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN source /root/.nvm/nvm.sh && nvm install v20.8.1
