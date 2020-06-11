FROM node:10
WORKDIR /opt/app-root/src
RUN npm install -g serve
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD [" node_modules/serve/bin/serve.js", "-s", "build", "-l", "8080"]