import { getAccessToken, uploadPackage, waitUntilPackageValidated } from '@/edge-addon-utils'
import { handleError } from '@/error'

function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`)
  }
  return value
}

async function main(): Promise<void> {
  const clientId = requireEnvironmentVariable('TEST_CLIENT_ID')
  const clientSecret = requireEnvironmentVariable('TEST_CLIENT_SECRET')
  const accessTokenUrl = requireEnvironmentVariable('TEST_ACCESS_TOKEN_URL')
  const productId = requireEnvironmentVariable('TEST_PRODUCT_ID')
  const zipPath = 'test/test-extension.zip'

  try {
    const accessToken = await getAccessToken(clientId, clientSecret, accessTokenUrl)
    const uploadOperationId = await uploadPackage(productId, zipPath, accessToken)
    await waitUntilPackageValidated(productId, accessToken, uploadOperationId)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
