# Edge Addon

This action publishes your Edge add-on onto [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/Microsoft-Edge-Extensions-Home) using the [Microsoft Edge Add-ons API v1](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api).

This action can only publish new version of an existing add-on. Publishing a new add-on is not supported.

## Prepare

Following items are required before publishing your Edge add-on:

- A zip file to be uploaded.
- An API client ID and secret.
- An access token url.

Please refer to this [tutorial](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api#before-you-begin) for how to generate API keys and discover access token url.

## Usage

All options are required.

- `product-id`: the id of your add-on.
- `zip-path`: path to the zip file built in the previous steps.
- `client-id`: your API client ID.
- `client-secret`: your API client secret.
- `access-token-url`: your access token URL.

Example:

```yaml
steps:
  - uses: wdzeng/edge-addon@v1
    with:
      product-id: your-addon-product-id
      zip-path: your-addon.zip
      client-id: ${{ secrets.EDGE_CLIENT_ID }}
      client-secret: ${{ secrets.EDGE_CLIENT_SECRET }}
      refresh-token: ${{ secrets.EDGE_REFRESH_TOKEN_URL }}
```

## References

- [Using the Microsoft Edge Add-ons API](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api)
- [Microsoft Edge Add-ons API](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api)
