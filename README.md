# Edge Add-on

[![version](https://img.shields.io/github/v/release/wdzeng/edge-addon)](https://github.com/wdzeng/edge-addon/releases/latest)
[![license](https://img.shields.io/github/license/wdzeng/edge-addon?color=red)](https://github.com/wdzeng/edge-addon/blob/main/LICENSE)

This action publishes your Edge add-on onto [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/Microsoft-Edge-Extensions-Home)
using the [Microsoft Edge Add-ons API v1.1](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api).

> [!NOTE]
> This action can only publish a new version of an existing add-on. Publishing a new add-on is not
> supported.

## Prerequisites

Following items are required before you publishing your Edge add-on:

- A zip file to upload.
- An API key and a client ID.

Please refer to this [tutorial](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api#before-you-begin)
for how to generate an API key and a client ID.

## Usage

Unless noted with a default value, all options are required.

- `product-id`: the id of your add-on.
- `zip-path`: path to the zip file to upload; may include a glob pattern (only one file must match).
- `api-key`: you API key.
- `client-id`: your API client ID.
- `upload-only`: (boolean) `true` indicates this extension will be uploaded without publishing
  (you'll have to publish it manually); default to `false`.
- `notes-for-certification`: (optional) A secret text to Microsoft reviewers.

Example:

```yaml
steps:
  - uses: wdzeng/edge-addon@v2
    with:
      product-id: your-addon-product-id
      zip-path: your-addon.zip
      api-key: ${{ secrets.API_KEY }}
      client-id: ${{ secrets.CLIENT_ID }}
```

## References

- [Using the Microsoft Edge Add-ons API](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api)
- [Microsoft Edge Add-ons API](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api)

## Sister Actions

- [Chrome Extension Action](https://github.com/wdzeng/chrome-extension)
- [Firefox Add-on Action](https://github.com/wdzeng/firefox-addon)
