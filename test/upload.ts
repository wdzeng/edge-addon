import fs from 'node:fs'

import tmp from 'tmp'

import { handleError } from '@/error'
import { uploadPackage } from '@/lib'
import { isGitHubAction, logger } from '@/utils'

// Base64-encoded ZIP file.
const TEST_ADDON = `
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
BgBPAgAAOQUAAAAA`

function getEnv(): {
  apiKey: string
  clientId: string
  productId: string
} {
  const apiKey = process.env.TEST_API_KEY
  const clientId = process.env.TEST_CLIENT_ID
  const productId = process.env.TEST_PRODUCT_ID
  if (!apiKey || !clientId || !productId) {
    if (isGitHubAction()) {
      logger.setFailed(
        'Environment variables TEST_API_KEY, TEST_CLIENT_ID and TEST_PRODUCT_ID are required. Did you set the secrets?'
      )
      process.exit(1)
    }

    throw new Error(
      'Environment variables TEST_API_KEY, TEST_CLIENT_ID and TEST_PRODUCT_ID are required. Did you have a .env.local file under the test/ directory?'
    )
  }
  return { apiKey, clientId, productId }
}

async function main(): Promise<void> {
  const { apiKey, clientId, productId } = getEnv()

  const zipPath = `${tmp.fileSync().name}.zip`
  fs.writeFileSync(zipPath, TEST_ADDON, 'base64')

  try {
    await uploadPackage(productId, zipPath, apiKey, clientId)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
