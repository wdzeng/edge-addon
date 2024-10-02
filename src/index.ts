import * as core from '@actions/core'

import { handleError } from '@/error'
import { publishPackage, uploadPackage } from '@/lib'
import { tryResolvePath } from '@/utils'

async function run(
  productId: string,
  zipPath: string,
  apiKey: string,
  clientId: string,
  uploadOnly: boolean
): Promise<void> {
  await uploadPackage(productId, zipPath, apiKey, clientId)
  if (!uploadOnly) {
    await publishPackage(productId, apiKey, clientId)
  }
}

async function main() {
  const apiKey = core.getInput('api-key', { required: true })
  const clientId = core.getInput('client-id', { required: true })

  const productId = core.getInput('product-id', { required: true })
  let zipPath = core.getInput('zip-path', { required: true })
  const uploadOnly = core.getBooleanInput('upload-only')

  try {
    zipPath = tryResolvePath(zipPath)
    await run(productId, zipPath, apiKey, clientId, uploadOnly)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
