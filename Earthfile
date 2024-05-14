VERSION 0.8

docker-cli:
    FROM docker:25.0.4-cli
    SAVE ARTIFACT /usr/local/bin/docker
    SAVE ARTIFACT /usr/local/libexec/docker/cli-plugins/docker-buildx
    SAVE ARTIFACT /usr/local/libexec/docker/cli-plugins/docker-compose

node:
    FROM node:18.19.1
    WORKDIR /app

nx:
    FROM +node
    RUN npm install -g nx

nx-node-modules:
    FROM +nx
    CACHE /root/.npm
    COPY package.json package-lock.json .
    RUN npm ci

nx-dependencies:
    FROM +nx-node-modules
    COPY . .

nx-target:
    FROM +nx-dependencies
    ARG --required TARGET
    RUN --mount=type=cache,target=/app/.nx nx run-many -t ${TARGET}

nx-build:
    FROM +nx-target --TARGET="build"
    SAVE ARTIFACT dist/*

nx-app-npm-install:
    FROM +node
    ARG --required APP_NAME
    COPY +nx-build/apps/${APP_NAME}/package.json .
    COPY +nx-build/apps/${APP_NAME}/package-lock.json .
    # TODO: use cached node_modules
    RUN --mount=type=cache,target=/root/.npm npm install --audit=false --omit=dev
    SAVE ARTIFACT node_modules/

APP:
    FUNCTION
    ARG --required APP_NAME
    COPY +nx-app-npm-install/node_modules/ ./node_modules/
    COPY +nx-build/apps/${APP_NAME}/ .
    # DO +APP --APP_NAME=""

npm-test-docker-image:
    FROM +nx-node-modules
    # TODO: do not add workspace specific dependencies here
    DO ./apps/executor+IMPORT_BINARY_DEPENDENCIES
    COPY . .
    ENTRYPOINT [ "nx", "run-many", "-t" ]

npm-test:
    FROM earthly/dind:alpine
    COPY +docker-cli/docker-compose /usr/local/libexec/docker/cli-plugins/
    RUN docker compose version

    # include each test directory that includes snapshot tests
    COPY apps/ /app/apps/
    COPY libs/ /app/libs/
    DO ./apps/executor+IMPORT_TEST_DEPENDENCIES --PROJECT_ROOT="/app/libs/executor-lib"

    COPY test/docker-compose.yml /app/test/docker-compose.yml
    ARG TEST_ARGS="test"
    WORKDIR /app
    WITH DOCKER \
            --pull alpine:3.19.1 \
            --pull earthly/buildkitd:v0.8.4 \
            --load localhost:5000/test:earthly=+npm-test-docker-image
        RUN docker compose --file=test/docker-compose.yml run --rm test $TEST_ARGS
    END

npm-test-update-snapshots:
    FROM +npm-test --TEST_ARGS="test -- --updateSnapshot"
    SAVE ARTIFACT apps/* AS LOCAL ./apps/
    SAVE ARTIFACT libs/* AS LOCAL ./libs/

test:
    BUILD +npm-test

test-update-snapshots:
    BUILD +npm-test-update-snapshots

start:
    LOCALLY
    WITH DOCKER \
        --load localhost:5000/sca-opensearch:dev=./docker+opensearch \
        --load localhost:5000/sca-opensearch-dashboards:dev=./docker+opensearch-dashboards
        RUN docker compose up --build --remove-orphans --wait
    END
