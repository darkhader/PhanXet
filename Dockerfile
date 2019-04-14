FROM node:8-slim

WORKDIR /starter
ENV NODE_ENV development

COPY package.json /starter/package.json

RUN npm install --production
RUN npm install -g supervisor

COPY .env.example /starter/.env.example
COPY . /starter

CMD ["supervisor","app.js"]

EXPOSE 8080
