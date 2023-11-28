# headless-three
This library is for rendering CAD models in three.js sceens in a headless environment.

Supported formats: bld, fbx, glb, ifc, obj, pdb, stl, xyz.

[See src/Filetypes.js for current listing](https://github.com/bldrs-ai/headless-three/tree/main/src/Filetypes.js)

## Setup
Requires Node v18+.

```
$ yarn install
$ yarn test
```

## Run
Run the headless server:
```
$ yarn serve
...
```

### Docker server

To run the server locally, you will need a working Docker installation.

    $ docker compose build   # Build the Docker image
    $ docker compose up -d   # Start the server, accessible at http://localhost:8001


## Client Requests

Send a render request pointing to a CAD file URL:
```
$ curl -d '{"url": "https://github.com/bldrs-ai/headless-three/blob/main/models/ifc/index.ifc"}' \
       -H 'content-type: application/json' \
       -o rendered.png \
       http://localhost:8001/render


Example render of index.ifc:
![index.ifc rendered to index.png](https://github.com/bldrs-ai/headless-three/blob/main/models/index.png)
![Bunny.obj rendered to Bunny.png](https://github.com/bldrs-ai/headless-three/blob/main/models/Bunny.png)


### Local Server Test script
```
for f in `ls models/*/*.{bld,fbx,ifc,obj,stl,pdb,xyz}` ; do
  curl -f -d "{\"url\": \"http://localhost:8090/$f\"}" \
       -H 'content-type: application/json' \
       -o "$f"-fit.png --fail --silent --show-error \
       -D- http://localhost:8001/render > log ;
  grep -q '200 OK' log || /bin/mv -f log $f.err ;
done
```

## Design

![dataflow](https://github.com/bldrs-ai/headless-three/blob/main/flow.png)
