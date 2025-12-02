FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force && npm install

COPY . .

EXPOSE 3000

RUN npm install -g nodemon

CMD ["nodemon", "server.js"]
