FROM node:18-slim AS builder

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y libxi-dev libglu1-mesa-dev libglew-dev xvfb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN yarn install
RUN yarn build

EXPOSE 8001
CMD ["xvfb-run", "--error-file=/dev/stderr", "--listen-tcp", "--server-args", "-ac -screen 0 1024x768x24 +extension GLX +render", "node", "build/server-bundle.js"]
