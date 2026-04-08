import { expect, test } from 'vitest'

import { tryGetErrorMessage } from '#/error'

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
