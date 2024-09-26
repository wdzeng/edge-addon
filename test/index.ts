import { handleError } from '@/error'
import { uploadPackage, waitUntilPackageValidated } from '@/lib'

function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`)
  }
  return value
}

async function main(): Promise<void> {
  const apiKey = requireEnvironmentVariable('TEST_API_KEY')
  const clientId = requireEnvironmentVariable('TEST_CLIENT_ID')
  const productId = requireEnvironmentVariable('TEST_PRODUCT_ID')
  const zipPath = 'test/test-extension.zip'

  try {
    const uploadOperationId = await uploadPackage(productId, zipPath, apiKey, clientId)
    await waitUntilPackageValidated(productId, apiKey, clientId, uploadOperationId)
  } catch (e: unknown) {
    handleError(e)
  }
}

void main()
