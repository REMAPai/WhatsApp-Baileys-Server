FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY src/ ./src/

RUN mkdir -p /app/auth_info

EXPOSE 3020

ENV PORT=3020

CMD ["node", "src/index.js"]
