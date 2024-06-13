FROM node:20.12.2-alpine3.18

WORKDIR /user/src/app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "start"]