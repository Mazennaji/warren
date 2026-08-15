FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend ./frontend

RUN npm install

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]