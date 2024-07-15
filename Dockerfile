# pull official base image
FROM node:20

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
USER 0
RUN npm install -g next
RUN npm install

# add app
COPY . ./
EXPOSE 8080
RUN next build
# start app
CMD ["next","start", "-p", "8080"]
