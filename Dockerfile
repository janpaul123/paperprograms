FROM node:9.3
LABEL maintainer="jon.gold@airbnb.com"

RUN mkdir -p /app

WORKDIR /app

ADD package*.json ./
RUN npm install

COPY . /app/
