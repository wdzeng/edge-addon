import fs from 'node:fs'

import * as core from '@actions/core'
import { globSync } from 'glob'

import { ERR_INVALID_INPUT, EdgeAddonActionError } from '@/error'

export function stringify(e: unknown): string {
  if (typeof e === 'object') {
    return JSON.stringify(e)
  }
  if (typeof e === 'string') {
    return e
  }
  return String(e)
}

export function tryResolveFile(pattern: string): string {
  const foundFiles = globSync(pattern)

  if (foundFiles.length < 1) {
    throw new EdgeAddonActionError(`File not found: ${pattern}`, ERR_INVALID_INPUT)
  }
  if (foundFiles.length > 1) {
    throw new EdgeAddonActionError(`Multiple files found: ${pattern}`, ERR_INVALID_INPUT)
  }

  const stat = fs.statSync(foundFiles[0])

  if (!stat.isFile()) {
    throw new EdgeAddonActionError(`Not a regular file: ${pattern}`, ERR_INVALID_INPUT)
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
