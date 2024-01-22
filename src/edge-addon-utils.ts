import assert from 'node:assert'
import fs from 'node:fs'

import * as core from '@actions/core'
import axios, { AxiosError } from 'axios'

import type { AccessTokenErrorResponse, AccessTokenSuccessResponse } from '@/api-types/access-token'
import type { ExpectedStatusResponse, StatusResponse } from '@/api-types/status'
import {
  ERR_ACCESS_TOKEN,
  ERR_PACKAGE_VALIDATION,
  ERR_PUBLISHING_PACKAGE,
  OPERATION_TIMEOUT_EXCEEDED,
  RESPONSE_NO_LOCATION,
  RESPONSE_NO_STATUS,
  getStringOrError,
  stringify
} from '@/error'

import type { AxiosResponse } from 'axios'

const WAIT_DELAY = 10 * 1000 // 10 seconds
const MAX_WAIT_TIME = 10 * 60 * 1000 // 10 minutes

function requireExpectedStatusResponse(
  res: AxiosResponse<StatusResponse>
): asserts res is AxiosResponse<ExpectedStatusResponse> {
  if ('status' in res.data) {
    return
  }
  core.debug(JSON.stringify(res.data))
  core.setFailed('The API server does not provide status information.')
  process.exit(RESPONSE_NO_STATUS)
}

function getOperationIdFromResponse(response: AxiosResponse<StatusResponse>): string {
  const responseHeaders = response.headers

  if ('location' in responseHeaders) {
    const operationId = responseHeaders.location as string
    core.debug(`Operation ID: ${operationId}`)
    return operationId
  }

  core.debug(JSON.stringify(responseHeaders))
  core.setFailed('The API server does not provide location information.')
  return process.exit(RESPONSE_NO_LOCATION)
}

async function waitUntilOperationSucceeded(url: string, token: string): Promise<boolean> {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#check-the-status-of-a-package-upload
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#check-the-publishing-status

  let response: AxiosResponse<StatusResponse> | undefined = undefined
  const headers = { Authorization: `Bearer ${token}` }

  const endTime = Date.now() + MAX_WAIT_TIME
  while (Date.now() < endTime) {
    core.info('Checking if operation has succeeded.')

    response = await axios<StatusResponse>(url, { headers })
    requireExpectedStatusResponse(response)

    if (response.data.status !== 'InProgress') {
      break
    }

    core.info('Operation still in progress.')
    await new Promise(res => setTimeout(res, WAIT_DELAY))
  }

  assert(response && 'status' in response.data)

  if (response.data.status === 'Succeeded') {
    return true
  }

  if (response.data.status === 'InProgress') {
    core.setFailed('Operation timeout exceeded.')
    process.exit(OPERATION_TIMEOUT_EXCEEDED)
  }

  // Here operation failed.

  if (response.data.message) {
    core.setFailed(response.data.message)
  }

  if (response.data.errorCode) {
    core.setFailed(`Validation failed: ${response.data.errorCode}`)
  } else {
    core.setFailed('Validation failed. The API server does not provide any error code.')
  }

  if (response.data.errors?.length) {
    for (const e of response.data.errors) {
      core.setFailed(getStringOrError(e))
    }
  }

  if (!response.data.message && !response.data.errors?.length) {
    core.debug(stringify(response.data))
    core.setFailed('Validation failed. The API server does not provide any error message.')
  }

  return false
}

export async function getAccessToken(
  clientId: string,
  clientSecret: string,
  accessTokenUrl: string
): Promise<string> {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api#retrieving-the-access-token

  core.info('Start to get access token.')

  const formData = new URLSearchParams()
  formData.append('client_id', clientId)
  formData.append('scope', 'https://api.addons.microsoftedge.microsoft.com/.default')
  formData.append('client_secret', clientSecret)
  formData.append('grant_type', 'client_credentials')

  let response: AxiosResponse<AccessTokenSuccessResponse>

  try {
    response = await axios.post<AccessTokenSuccessResponse>(accessTokenUrl, formData)
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      const errorResponse = error.response.data as AccessTokenErrorResponse
      core.debug(stringify(errorResponse))
      core.setFailed(`Failed to get access token: ${errorResponse.error_description}`)
      process.exit(ERR_ACCESS_TOKEN)
    }
    throw error
  }

  const accessToken = response.data.access_token
  core.info('Access token received.')
  return accessToken
}

export async function uploadPackage(
  productId: string,
  zipPath: string,
  token: string
): Promise<string> {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api#uploading-a-package-to-update-an-existing-submission
  core.info('Uploading package.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions/draft/package`
  const zipStream = fs.createReadStream(zipPath)
  const headers = { 'Content-Type': 'application/zip', 'Authorization': `Bearer ${token}` }
  const response = await axios.post<never>(url, zipStream, { headers }) // 202 Accepted
  const operationId = getOperationIdFromResponse(response)
  core.info('Package uploaded.')
  return operationId
}

export async function waitUntilPackageValidated(
  productId: string,
  token: string,
  operationId: string
) {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#check-the-package-upload-status
  core.info('Waiting until upload request accepted.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions/draft/package/operations/${operationId}`
  const ok = await waitUntilOperationSucceeded(url, token)
  if (!ok) {
    core.setFailed('Package validation failed.')
    process.exit(ERR_PACKAGE_VALIDATION)
  }
  core.info('Validation succeeded.')
}

export async function sendPackagePublishingRequest(
  productId: string,
  token: string
): Promise<string> {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api#publishing-the-submission
  core.info('Sending publishing request.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions`
  const response = await axios.post<never>(
    url,
    {}, // Empty body
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const operationId = getOperationIdFromResponse(response)
  core.info('Publishing request sent.')
  return operationId
}

export async function waitUntilPackagePublished(
  productId: string,
  token: string,
  operationId: string
) {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#check-the-publishing-status
  core.info('Waiting until publishing request accepted.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions/operations/${operationId}`
  const ok = await waitUntilOperationSucceeded(url, token)
  if (!ok) {
    core.setFailed('Failed to publish addon.')
    process.exit(ERR_PUBLISHING_PACKAGE)
  }
  core.info('Addon published.')
}
