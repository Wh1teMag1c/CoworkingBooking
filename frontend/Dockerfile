FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["sh", "-c", "rm -rf /app/build-volume/* && cp -r dist/* /app/build-volume/ && echo 'Frontend build copied successfully!' && tail -f /dev/null"]