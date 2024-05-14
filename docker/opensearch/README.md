# Opensearch docker image

- [Proxy-based authentication](https://opensearch.org/docs/latest/security/authentication-backends/proxy/) enabled
- guest role
  - read access to `public_*` indices
  - read only access to Opensearch Dashboards global tenant

## Development

### Build image

```sh
earthly +docker-image
```

### Modify config

1. Export config from original image. This will overwrite the content of `config/` directory.

    ```sh
    earthly +export-config
    ```

2. Modify config files in `config/`. See `config-patches/` for reference to what was changed previously.
3. Generate new patch files for `config-patches/` based on the current content of `config/`.

    ```sh
    earthly +update-config-patches
    ```
