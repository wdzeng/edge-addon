import * as core from '@actions/core'

import { handleError } from '@/error'
import {
  sendPackagePublishingRequest,
  uploadPackage,
  waitUntilPackagePublished,
  waitUntilPackageValidated
} from '@/lib'

async function run(
  productId: string,
  zipPath: string,
  apiKey: string,
  clientId: string,
  uploadOnly: boolean
): Promise<void> {
  const uploadOperationId = await uploadPackage(productId, zipPath, apiKey, clientId)
  await waitUntilPackageValidated(productId, apiKey, clientId, uploadOperationId)
  if (!uploadOnly) {
    const publishingOperationId = await sendPackagePublishingRequest(productId, apiKey, clientId)
    await waitUntilPackagePublished(productId, apiKey, clientId, publishingOperationId)
  }
}

async function main() {
  const apiKey = core.getInput('api-key', { required: true })
  const clientId = core.getInput('client-id', { required: true })

  const productId = core.getInput('product-id', { required: true })
  const zipPath = core.getInput('zip-path', { required: true })
  const uploadOnly = core.getBooleanInput('upload-only')

  try {
    await run(productId, zipPath, apiKey, clientId, uploadOnly)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
