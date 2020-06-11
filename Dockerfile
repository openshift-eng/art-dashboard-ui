FROM node:10
WORKDIR /opt/app-root/src
COPY package*.json ./
RUN npm install
RUN npm install -g serve
COPY . .
EXPOSE 8080
CMD ["serve", "-s", "build", "-l", "8080"]