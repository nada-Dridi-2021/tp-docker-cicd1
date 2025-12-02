FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (changed from npm ci to npm install)
RUN npm install --omit=dev

# Copy application files
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
