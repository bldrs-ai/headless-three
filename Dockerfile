FROM node:16-slim AS builder

RUN apt-get update && \
    apt-get install -y git python3 build-essential libxi-dev libglu1-mesa-dev libglew-dev xvfb pkg-config && \
    apt-get clean && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY ["package.json", "yarn.lock", "./"]
RUN yarn install && \
    npm_config_build_from_source=true yarn add --force https://github.com/bldrs-ai/web-ifc-three.git && \
    yarn build

COPY . .

FROM node:16-slim AS app

ENV NODE_ENV production

RUN apt-get update && \
    apt-get install -y git mesa-utils xserver-xorg xvfb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder ["/src/package.json", "/src/yarn.lock", "./"]
RUN yarn install --production
COPY --from=builder ["/src/node_modules/web-ifc-three", "./node_modules/web-ifc-three"]
COPY --from=builder /src/src ./

EXPOSE 8001
CMD ["xvfb-run", "--error-file=/dev/stderr", "--listen-tcp", "--server-args", "-ac -screen 0 1024x768x24 +extension GLX +render", "node", "server.js"]
