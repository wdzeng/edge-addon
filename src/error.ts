import { AxiosError } from 'axios'
import { CustomError } from 'ts-custom-error'

import { logger, stringify } from '@/utils'

export const ERR_UPLOADING_PACKAGE = 1
export const ERR_PUBLISHING_PACKAGE = 4
export const ERR_INVALID_INPUT = 9
export const ERR_UNKNOWN_HTTP = 254
export const ERR_UNKNOWN = 255

export class EdgeAddonActionError extends CustomError {
  constructor(
    message: string,
    readonly code: number
  ) {
    super(message)
  }
}

export function tryGetErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message
  }
  if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
    return e.message
  }
  return stringify(e)
}

export function getStringOrError(e: unknown): string | Error {
  return e instanceof Error ? e : stringify(e)
}

export function handleError(error: unknown): never {
  if (error instanceof EdgeAddonActionError) {
    logger.setFailed(error.message)
    process.exit(error.code)
  }

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
    process.exit(ERR_UNKNOWN_HTTP)
  }

  // Unknown error. This may be a bug of this action.
  let str_err = stringify(error)
  if (str_err.length > 256) {
    str_err = `${str_err.slice(0, 256)} <truncated>`
  }
  logger.debug(str_err)
  if (error instanceof Error) {
    logger.setFailed(`Unknown error occurred: ${error.message}`)
  } else {
    logger.setFailed('Unknown error occurred.')
  }
  process.exit(ERR_UNKNOWN)
}
