WORKDIR /opt/app-root/src
COPY package*.json ./
RUN npm install
COPY . .
