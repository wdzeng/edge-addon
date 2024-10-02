import assert from 'node:assert'
import fs from 'node:fs'

import axios from 'axios'

import type { PublishStatusResponse } from '@/api-types/publish'
import type { UploadStatusResponse } from '@/api-types/upload'
import {
  ERR_PUBLISHING_PACKAGE,
  ERR_UPLOADING_PACKAGE,
  EdgeAddonActionError,
  tryGetErrorMessage
} from '@/error'
import { logger } from '@/utils'

const WAIT_DELAY = 10 * 1000 // 10 seconds
const MAX_WAIT_TIME = 10 * 60 * 1000 // 10 minutes

async function sendUploadPackageRequest(
  productId: string,
  zipPath: string,
  apiKey: string,
  clientId: string
): Promise<string> {
  // https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#upload-a-package-to-update-an-existing-submission
  // https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api?tabs=v1-1#uploading-a-package-to-update-an-existing-submission
  logger.info('Uploading package.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions/draft/package`
  const zipStream = fs.createReadStream(zipPath)
  const headers = {
    'Content-Type': 'application/zip',
    'Authorization': `ApiKey ${apiKey}`,
    'X-ClientID': clientId
  }
  const response = await axios.post<never>(url, zipStream, { headers }) // 202 Accepted

  const operationId = response.headers.location as string | undefined
  if (!operationId) {
    logger.debug(JSON.stringify(response.headers))
    throw new EdgeAddonActionError(
      'Failed to upload the add-on. The API server does not provide operation ID.',
      ERR_UPLOADING_PACKAGE
    )
  }

  logger.info('Package uploaded.')
  return operationId
}

async function waitUntilPackageValidated(
  productId: string,
  apiKey: string,
  clientId: string,
  operationId: string
) {
  // https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api?tabs=v1-1#checking-the-status-of-a-package-upload
  // https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#check-the-status-of-a-package-upload
  logger.info('Waiting until upload request accepted.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions/operations/${operationId}`
  const headers = { 'Authorization': `ApiKey ${apiKey}`, 'X-ClientID': clientId }

  const endTime = Date.now() + MAX_WAIT_TIME
  let response: UploadStatusResponse | undefined = undefined
  while (Date.now() < endTime) {
    logger.info('Checking if operation has succeeded.')

    const axiosResponse = await axios<UploadStatusResponse>(url, { headers })
    response = axiosResponse.data
    if (response.status !== 'InProgress') {
      break
    }

    logger.info(`Operation still in progress. Try again after ${WAIT_DELAY} ms.`)
    await new Promise(res => setTimeout(res, WAIT_DELAY))
  }

  // Try for the last time.
  if (response === undefined) {
    const axiosResponse = await axios<UploadStatusResponse>(url, { headers })
    response = axiosResponse.data
    if (response.status === 'InProgress') {
      throw new EdgeAddonActionError('Operation timeout exceeded.', ERR_UPLOADING_PACKAGE)
    }
  }

  assert(response.status !== 'InProgress')

  if (response.status === 'Succeeded') {
    logger.info('Validation succeeded.')
    return
  }

  logger.debug(`response: ${JSON.stringify(response)}`)
  if (!response.message) {
    throw new EdgeAddonActionError(
      'Failed to validate the add-on; the API server does not tell why.',
      ERR_UPLOADING_PACKAGE
    )
  }

  logger.error(response.message)
  for (const e of response.errors ?? []) {
    logger.error(tryGetErrorMessage(e))
  }
  throw new EdgeAddonActionError('Failed to validate the add-on.', ERR_UPLOADING_PACKAGE)
}

export async function uploadPackage(
  productId: string,
  zipPath: string,
  apiKey: string,
  clientId: string
) {
  const operationId = await sendUploadPackageRequest(productId, zipPath, apiKey, clientId)
  await waitUntilPackageValidated(productId, apiKey, clientId, operationId)
}

async function sendPackagePublishingRequest(
  productId: string,
  apiKey: string,
  clientId: string
): Promise<string> {
  // https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#publish-the-product-draft-submission
  // https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/using-addons-api?tabs=v1-1#publishing-the-submission
  logger.info('Sending publishing request.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions`
  const response = await axios.post<never>(
    url,
    {}, // Empty body
    { headers: { 'Authorization': `ApiKey ${apiKey}`, 'X-ClientID': clientId } }
  )

  const operationId = response.headers.location as string | undefined
  if (!operationId) {
    logger.debug(JSON.stringify(response.headers))
    throw new EdgeAddonActionError(
      'Failed to publish the add-on. The API server does not provide operation ID.',
      ERR_PUBLISHING_PACKAGE
    )
  }
  logger.info('Publishing request sent.')
  return operationId
}

async function waitUntilPackagePublished(
  productId: string,
  apiKey: string,
  clientId: string,
  operationId: string
) {
  // https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#check-the-publishing-status
  logger.info('Waiting until publishing request accepted.')
  const url = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions/operations/${operationId}`
  const headers = { 'Authorization': `ApiKey ${apiKey}`, 'X-ClientID': clientId }

  const endTime = Date.now() + MAX_WAIT_TIME
  let response: PublishStatusResponse | undefined = undefined
  while (Date.now() < endTime) {
    logger.info('Checking if the publishing operation has succeeded.')

    const axiosResponse = await axios<PublishStatusResponse>(url, { headers })
    response = axiosResponse.data

    if (!('status' in response) || response.status !== 'InProgress') {
      break
    }

    logger.info(`Operation still in progress. Try again after ${WAIT_DELAY} ms.`)
    await new Promise(res => setTimeout(res, WAIT_DELAY))
  }

  // Try for the last time.
  if (response === undefined) {
    const axiosResponse = await axios<PublishStatusResponse>(url, { headers })
    response = axiosResponse.data
    if ('status' in response && response.status === 'InProgress') {
      throw new EdgeAddonActionError('Operation timeout exceeded.', ERR_PUBLISHING_PACKAGE)
    }
  }

  // Unexpected response.
  if (!('status' in response)) {
    logger.debug(`response: ${JSON.stringify(response)}`)
    const ref =
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-publish-call-fails-with-an-unexpected-failure'
    throw new EdgeAddonActionError(
      `Failed to publish the add-on for unknown reason. This should be an internal error on the Microsoft Edge Add-ons API server side. You may want to check the API documentation: ${ref}`,
      ERR_PUBLISHING_PACKAGE
    )
  }

  assert(response.status !== 'InProgress')

  if (response.status === 'Succeeded') {
    logger.info('Package published.')
    return
  }

  logger.debug(`response: ${JSON.stringify(response)}`)
  if (!response.message) {
    throw new EdgeAddonActionError(
      'Failed to publish the add-on; the API server does not tell why.',
      ERR_PUBLISHING_PACKAGE
    )
  }

  logger.error(response.message)
  for (const e of response.errors ?? []) {
    logger.error(tryGetErrorMessage(e))
  }

  // Some error cases are listed in the API documentation. Print some hints for the users to debug.
  const errorCases: Record<string, string | undefined> = {
    CreateNotAllowed:
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-a-new-product-is-published',
    InProgressSubmission:
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-theres-an-in-review-submission-for-the-same-product',
    ModuleStateUnPublishable:
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-where-any-of-the-modules-are-invalid',
    NoModulesUpdated:
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-theres-nothing-new-to-be-published',
    SubmissionValidationError:
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-there-are-validation-errors-in-submission',
    UnpublishInProgress:
      'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-theres-an-ongoing-unpublished-submission-for-the-same-product'
  }
  const ref = errorCases[response.errorCode ?? '']
  if (ref) {
    logger.error(`For this type of failure, you may want to check the API documentation: ${ref}`)
  }

  throw new EdgeAddonActionError('Failed to publish the add-on.', ERR_PUBLISHING_PACKAGE)
}

export async function publishPackage(productId: string, apiKey: string, clientId: string) {
  const operationId = await sendPackagePublishingRequest(productId, apiKey, clientId)
  await waitUntilPackagePublished(productId, apiKey, clientId, operationId)
}
