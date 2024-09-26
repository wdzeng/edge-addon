import { handleError } from '@/error'
import { uploadPackage, waitUntilPackageValidated } from '@/lib'
import { isGitHubAction, logger } from '@/utils'

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
  const zipPath = 'test/test-extension.zip'

  try {
    const uploadOperationId = await uploadPackage(productId, zipPath, apiKey, clientId)
    await waitUntilPackageValidated(productId, apiKey, clientId, uploadOperationId)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
