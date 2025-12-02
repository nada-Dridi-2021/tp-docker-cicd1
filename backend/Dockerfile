FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
