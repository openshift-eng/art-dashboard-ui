# pull official base image
FROM node:18

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Set default namespace to aos-art-web
# This value is overriden by the build config argument in art-build-dev namespace
ARG OPENSHIFT_BUILD_NAMESPACE=aos-art-web

# To expose env variables to the browser, nextjs requeires the variable to be prepended with NEXT_PUBLIC
ENV NEXT_PUBLIC_OPENSHIFT_BUILD_NAMESPACE=$OPENSHIFT_BUILD_NAMESPACE

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
