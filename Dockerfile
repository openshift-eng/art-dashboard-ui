FROM node:10
WORKDIR /opt/app-root/src
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "./node_modules/serve/bin/serve.js", "-s", "build", "-l", "8080"]
