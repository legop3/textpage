# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.2.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production


WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


# Copy files as root (default)
COPY . .

# Set ownership of app files to 'node'
RUN chown -R node:node /usr/src/app
RUN rm -rf node_modules && npm install

# Switch to non-root user AFTER copying files
USER node


# Expose the port that the application listens on.
# EXPOSE 3621
# EXPOSE 8888
# EXPOSE 5555

# Run the application.
CMD node main.mjs


# to build and push cause i forgort:

# docker build -t legop3/textpage .
# docker push legop3/textpage
