FROM node:10
WORKDIR /opt/app-root/src
RUN npm install -g serve
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["serve", "-s", "build", "-l", "8080"]