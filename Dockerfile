FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js index.html ./
COPY css ./css
COPY js ./js

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]


