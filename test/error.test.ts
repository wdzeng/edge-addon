import { AxiosError } from 'axios'
import { CustomError } from 'ts-custom-error'
import { expect, test, vi } from 'vitest'

import {
  ERR_UNKNOWN,
  ERR_UNKNOWN_HTTP,
  EdgeAddonActionError,
  handleError,
  tryGetErrorMessage
} from '@/error'

test('tryGetErrorMessage', () => {
  expect(tryGetErrorMessage(new Error('hello'))).toBe('hello')
  expect(tryGetErrorMessage({ message: 'hello' })).toBe('hello')
  expect(tryGetErrorMessage('hello')).toBe('hello')
  expect(tryGetErrorMessage(42)).toBe('42')
  expect(tryGetErrorMessage([1, 2, 3])).toBe('[1,2,3]')
  expect(tryGetErrorMessage({ foo: 'bar' })).toBe('{"foo":"bar"}')
  expect(tryGetErrorMessage(null)).toBe('null') // eslint-disable-line unicorn/no-null
  expect(tryGetErrorMessage(undefined)).toBe('undefined')
  expect(tryGetErrorMessage({ message: { foo: 'bar' } })).toBe('{"message":{"foo":"bar"}}')
})

test('handleError', () => {
  class ProcessExitError extends CustomError {
    constructor(readonly code: string | number | null | undefined) {
      super(`Process exited with code ${code}`)
    }
  }

  const spy = vi
    .spyOn(process, 'exit')
    .mockImplementation((exitCode: string | undefined | null | number) => {
      throw new ProcessExitError(exitCode)
    })

  expect(() => {
    handleError(new EdgeAddonActionError('message', 42))
  }).toThrowError(new ProcessExitError(42))
  expect(() => {
    handleError(new AxiosError('hello'))
  }).toThrowError(new ProcessExitError(ERR_UNKNOWN_HTTP))
  expect(() => {
    handleError(new Error('hello'))
  }).toThrowError(new ProcessExitError(ERR_UNKNOWN))

  spy.mockRestore()
})
