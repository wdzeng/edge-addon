import { AxiosError } from 'axios'

import { logger, stringify } from '#/utils'

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
