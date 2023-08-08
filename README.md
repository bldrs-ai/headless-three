# headless-three
This library aims for headless rendering of three.js scenes based on models by common CAD formats.

Currently supports IFC models.

## Setup
This library uses a custom build of web-ifc-three.

```
$ yarn install
$ npm_config_build_from_source=true yarn add --force https://github.com/bldrs-ai/web-ifc-three.git
$ yarn build
```

## Run the tool

### Local file
```
# Grab the coords from a model on Bldrs, e.g. the default homepage:
#   https://bldrs.ai/share/v/p/index.ifc#c:-150.147,-85.796,167.057,-32.603,17.373,-1.347
#
# Then add them as an arg after the model filename:
headless-three> node src/headless.js models/index.ifc -150.147,-85.796,167.057,-32.603,17.373,-1.347 && open screenshot.png
headless-three> node src/headless.js models/Bunny.obj 0,.3,.25,0,0,-0.1 && open screenshot.png
```

Example render of index.ifc:
![index.ifc rendered to index.png](https://github.com/bldrs-ai/headless-three/blob/main/models/index.png)
![Bunny.obj rendered to Bunny.png](https://github.com/bldrs-ai/headless-three/blob/main/models/Bunny.png)


## Design

![dataflow](https://github.com/bldrs-ai/headless-three/blob/main/flow.png)


## Local Development (Server)

To run the server locally, you will need a working Docker installation.

    $ docker compose build   # Build the Docker image
    $ docker compose up -d   # Start the server, accessible at http://localhost:8001
    $ curl -d '{"url": "http://server.com/path/to/a/model.ifc"}' \
        -H 'content-type: application/json' \
        -o rendered.png \
        http://localhost:8001/render
