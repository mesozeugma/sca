# Deployment instructions

## Requirements

- Docker
- Docker Compose v2
- Earthly

## Install / upgrade

1. Download latest version of `Earthfile` from this directory.

   Instructions from now on expect the downloaded file to be at `./Earthfile` relative path.

2. Create `./backend.env` configuration file

   - `ADMIN_TOKEN` adminsitrator user credential

   ```text
   ADMIN_TOKEN=SECRET
   ```

3. After making configuration file changes you have to run the install command.

   ```sh
   earthly +install
   ```

   This will create the `./sca/` directory.

4. Start services

   ```sh
   earthly +start
   ```

5. Run migrations using the backend cli.

   Commands must be executed from the `./sca/` directory.

   ```sh
   docker compose exec backend node cli.js -- migrate-database
   ```

   Optional: seed database

   ```sh
   docker compose exec backend node cli.js -- seed-database
   ```

   View available backend cli commands

   ```sh
   docker compose exec backend node cli.js -- help
   ```
