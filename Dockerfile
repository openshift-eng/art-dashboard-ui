FROM node:10
WORKDIR /opt/app-root/src
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm start > output.txt"]
