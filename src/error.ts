import { AxiosError } from 'axios'

import { logger } from '@/utils'

export const ERR_UPLOADING_PACKAGE = 1
export const ERR_PACKAGE_VALIDATION = 2
export const ERR_PUBLISHING_PACKAGE_REQUEST = 3
export const ERR_PUBLISHING_PACKAGE = 4
export const OPERATION_TIMEOUT_EXCEEDED = 5
export const RESPONSE_NO_LOCATION = 6
export const RESPONSE_NO_STATUS = 7
export const ERR_ACCESS_TOKEN = 8
export const UNKNOWN_ERROR = 255

export function stringify(e: unknown): string {
  if (typeof e === 'object') {
    return JSON.stringify(e)
  }
  if (typeof e === 'string') {
    return e
  }
  return String(e)
}

export function getStringOrError(e: unknown): string | Error {
  return e instanceof Error ? e : stringify(e)
}

export function handleError(error: unknown): never {
  // HTTP error.
  if (error instanceof AxiosError) {
    if (error.response) {
      // Got response from Microsoft Edge Add-ons API server (v1) with status code 4XX or 5XX.
      logger.setFailed(
        `Microsoft Edge Add-ons API server (v1) responses with error code: ${error.response.status}`
      )
      logger.setFailed(
        typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data)
      )
    }
    logger.setFailed(error.message)
  }

  // Unknown error.
  else if (error instanceof Error) {
    logger.setFailed(`Unknown error occurred: ${error.message}`)
    logger.debug(JSON.stringify(error))
  }

  // Unknown error type.
  else {
    logger.setFailed('Unknown error occurred.')
    logger.debug(JSON.stringify(error))
  }

  process.exit(UNKNOWN_ERROR)
}
