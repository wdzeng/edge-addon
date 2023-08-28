# Edge Addon

[![version](https://img.shields.io/github/v/release/wdzeng/edge-addon)](https://github.com/wdzeng/edge-addon/releases/latest)
[![license](https://img.shields.io/github/license/wdzeng/edge-addon?color=red)](https://github.com/wdzeng/edge-addon/blob/main/LICENSE)

This action publishes your Edge add-on onto [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/Microsoft-Edge-Extensions-Home)
using the [Microsoft Edge Add-ons API v1](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api).

This action can only publish new version of an existing add-on. Publishing a new add-on is not
supported.

## Prerequisites

Following items are required before publishing your Edge add-on:

- A zip file to be uploaded.
- An API client ID and secret.
- An access token url.

Please refer to this [tutorial](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api#before-you-begin)
for how to generate API keys and discover access token url.

## Usage

Unless noted with a default value, all options are required.

- `product-id`: the id of your add-on.
- `zip-path`: path to the zip file to be uploaded.
- `client-id`: your API client ID.
- `client-secret`: your API client secret.
- `access-token-url`: your access token URL.
- `upload-only`: (boolean) `true` indicates this extension will be uploaded without publishing
  (you'll have to publish it manually); default to `false`.
- `check-credentials-only` : (boolean) only test if given credentials are working; do not upload
  or publish the extension; enabling this option will ignore `product-id`, `zip-path`, and
  `upload-only` and make these options optional; default to `false`.

Example:

```yaml
steps:
  - uses: wdzeng/edge-addon@v1
    with:
      product-id: your-addon-product-id
      zip-path: your-addon.zip
      client-id: ${{ secrets.EDGE_CLIENT_ID }}
      client-secret: ${{ secrets.EDGE_CLIENT_SECRET }}
      access-token-url: ${{ secrets.EDGE_ACCESS_TOKEN_URL }}
```

## References

- [Using the Microsoft Edge Add-ons API](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api)
- [Microsoft Edge Add-ons API](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api)

## Sister Actions

- [Chrome Extension Action](https://github.com/wdzeng/chrome-extension)
- [Firefox Add-on Action](https://github.com/wdzeng/firefox-addon)
