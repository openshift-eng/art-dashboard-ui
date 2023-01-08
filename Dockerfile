# pull official base image
FROM node:18

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
USER 0
RUN npm install -g serve react-scripts
RUN npm install

# add app
COPY . ./
EXPOSE 8080
RUN npm run build
# start app
CMD ["serve", "-s", "build", "-l", "8080"]
