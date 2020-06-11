FROM node:10
USER root
WORKDIR /opt/app-root/src
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]

