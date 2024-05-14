# sca

Visualize various statistics about open source programs, especially cloud, fog and IoT simulators.

- [Deployment instructions](./docs/deploy/README.md)

## Development

### Requirements

- Docker
- Docker Compose v2
- Earthly
- Node.js

### Create dev config files

Create `.env`

```text
EARTHLY_ALLOW_PRIVILEGED="true"

OPENSEARCH_DASHBOARDS_BASE_URL="http://localhost:5602/opensearch-dashboards"
OPENSEARCH_URL=http://localhost:9200
ADMIN_TOKEN=SECRET
```

Create `apps/frontend/src/proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "pathRewrite": {
      "^/api": "/trpc"
    }
  },
  "/opensearch-dashboards": {
    "target": "http://localhost:5601",
    "secure": false
  }
}
```

### Start services

Start services for development environment

- OpenSearch will be available at port 9200
- OpenSearch Dashboards will be available at port 5601

```sh
earthly +start
```

Start services in watch mode

```sh
npx nx run-many -t serve
```

### CLI

The backend service has a cli.

During development it can be accessed using nx.

```sh
npx nx run backend:cli -- --help

# migrate database
npx nx run backend:cli -- migrate-database

# seed database
npx nx run backend:cli -- seed-database

# reset database
npx nx run backend:cli -- reset-database
```

### Other development tasks

Format code

```sh
npx nx format:check --all
npx nx format --all
```

Run tests

```sh
earthly +test
# update test snapshots
earthly +test-update-snapshots
```

Lint

```sh
npx nx run-many -t lint
```

Lint

```sh
npx nx run-many -t build
```
