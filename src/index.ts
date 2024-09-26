import * as core from '@actions/core'

import {
  getAccessToken,
  sendPackagePublishingRequest,
  tryResolvePath,
  uploadPackage,
  waitUntilPackagePublished,
  waitUntilPackageValidated
} from '@/edge-addon-utils'
import { handleError } from '@/error'

async function run(
  productId: string,
  zipPath: string,
  clientId: string,
  clientSecret: string,
  accessUrl: string,
  uploadOnly: boolean
): Promise<void> {
  const token = await getAccessToken(clientId, clientSecret, accessUrl)
  const uploadOperationId = await uploadPackage(productId, zipPath, token)
  await waitUntilPackageValidated(productId, token, uploadOperationId)
  if (!uploadOnly) {
    const publishingOperationId = await sendPackagePublishingRequest(productId, token)
    await waitUntilPackagePublished(productId, token, publishingOperationId)
  }
}

async function main() {
  const clientId = core.getInput('client-id', { required: true })
  const clientSecret = core.getInput('client-secret', { required: true })
  const accessTokenUrl = core.getInput('access-token-url', { required: true })

  const checkCredentialsOnly = core.getBooleanInput('check-credentials-only')
  if (checkCredentialsOnly) {
    try {
      await getAccessToken(clientId, clientSecret, accessTokenUrl)
    } catch (e: unknown) {
      handleError(e)
    }
    return
  }

  const productId = core.getInput('product-id', { required: true })
  let zipPath = core.getInput('zip-path', { required: true })
  const uploadOnly = core.getBooleanInput('upload-only')

  try {
    zipPath = tryResolvePath(zipPath)
    await run(productId, zipPath, clientId, clientSecret, accessTokenUrl, uploadOnly)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
