import fs from 'node:fs'

import * as core from '@actions/core'
import axios, { AxiosError } from 'axios'
import { globSync } from 'glob'

export function stringify(e: unknown): string {
  if (typeof e === 'object') {
    return JSON.stringify(e)
  }
  if (typeof e === 'string') {
    return e
  }

  // We can make sure e is not an object.
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(e)
}

export function tryResolveFile(pattern: string): string {
  const foundFiles = globSync(pattern)

  if (foundFiles.length < 1) {
    throw new Error(`File not found: ${pattern}`)
  }
  if (foundFiles.length > 1) {
    throw new Error(`Multiple files found: ${pattern}`)
  }

  const stat = fs.statSync(foundFiles[0])

  if (!stat.isFile()) {
    throw new Error(`Not a regular file: ${pattern}`)
  }

  return foundFiles[0]
}

export function isGitHubAction(): boolean {
  // https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
  return process.env.GITHUB_ACTIONS === 'true'
}

export interface Logger {
  setFailed(message: string | Error): void
  error(message: string): void
  warning(message: string): void
  info(message: string): void
  debug(message: string): void
}

class StderrLogger implements Logger {
  setFailed(message: string | Error): void {
    console.error(message)
  }
  error(message: string): void {
    console.error(message)
  }
  warning(message: string): void {
    console.error(message)
  }
  info(message: string): void {
    console.error(message)
  }
  debug(message: string): void {
    console.error(message)
  }
}

export const logger: Logger = isGitHubAction() ? core : new StderrLogger()

export function setUpAxiosInterceptor() {
  axios.interceptors.response.use(
    response => response,
    (error: unknown) => {
      const errorMessage =
        error instanceof AxiosError
          ? stringify(error.response?.data ?? error.message)
          : stringify(error)
      logger.setFailed(`HTTP error: ${errorMessage}`)
      return Promise.reject(
        new Error(
          `Microsoft Edge Add-ons API server (v1) responses with status code: ${(error as AxiosError).response?.status}`
        )
      )
    }
  )
}
