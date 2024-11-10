import fs from 'node:fs'

import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import tmp from 'tmp'
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import type {
  FailedPublishStatusResponse,
  InProgressPublishStatusResponse,
  SuccessfulPublishStatusResponse
} from '@/api-types/publish'
import type {
  FailedUploadStatusResponse,
  InProgressUploadStatusResponse,
  SuccessfulUploadStatusResponse
} from '@/api-types/upload'
import { ERR_PUBLISHING_PACKAGE, ERR_UPLOADING_PACKAGE, EdgeAddonActionError } from '@/error'
import { publishPackage, uploadPackage } from '@/lib'

const TEST_PRODUCT_ID = 'test-product-id'
const TEST_API_KEY = 'test-api-key'
const TEST_CLIENT_ID = 'test-client-id'
const TEST_OPERATION_ID = 'test-operation-id'
const AUTH_HEADERS_MATCHER: { asymmetricMatch: (...args: unknown[]) => boolean } =
  expect.objectContaining({
    'Authorization': `ApiKey ${TEST_API_KEY}`,
    'X-ClientID': TEST_CLIENT_ID
  })

const URL_CREATE_UPLOAD = `https://api.addons.microsoftedge.microsoft.com/v1/products/${TEST_PRODUCT_ID}/submissions/draft/package`
const URL_VALIDATE_UPLOAD = `https://api.addons.microsoftedge.microsoft.com/v1/products/${TEST_PRODUCT_ID}/submissions/draft/package/operations/${TEST_OPERATION_ID}`
const URL_CREATE_PUBLISH = `https://api.addons.microsoftedge.microsoft.com/v1/products/${TEST_PRODUCT_ID}/submissions`
const URL_VALIDATE_PUBLISH = `https://api.addons.microsoftedge.microsoft.com/v1/products/${TEST_PRODUCT_ID}/submissions/operations/${TEST_OPERATION_ID}`
const APPROVAL_NOTES = 'I always get the shemp'
const NO_APPROVAL_NOTES = undefined

describe('uploadPackage', () => {
  const TEST_ZIP_PATH = `${tmp.tmpNameSync()}.zip`
  let mockAdapter: AxiosMockAdapter

  beforeAll(() => {
    fs.writeFileSync(TEST_ZIP_PATH, 'test-zip-content')
  })

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(0)
    mockAdapter = new AxiosMockAdapter(axios)
  })

  afterEach(() => {
    mockAdapter.restore()
    vi.useRealTimers()
  })

  afterAll(() => {
    fs.unlinkSync(TEST_ZIP_PATH)
  })

  test('happy path', async () => {
    let hasValidated = false
    let uploadCreationTime: string | undefined = undefined

    mockAdapter
      .onPost(URL_CREATE_UPLOAD, undefined, { headers: AUTH_HEADERS_MATCHER })
      .replyOnce(() => {
        uploadCreationTime = new Date().toISOString()
        return [204, undefined, { location: TEST_OPERATION_ID }]
      })

    mockAdapter.onGet(URL_VALIDATE_UPLOAD, { headers: AUTH_HEADERS_MATCHER }).replyOnce(_ => {
      assert(uploadCreationTime)

      const now = new Date()
      if (now.getTime() < 9 * 60 * 1000) {
        return [
          200,
          {
            createdTime: uploadCreationTime,
            errorCode: null, // eslint-disable-line unicorn/no-null
            errors: null, // eslint-disable-line unicorn/no-null
            id: TEST_OPERATION_ID,
            lastUpdatedTime: now.toISOString(),
            message: null, // eslint-disable-line unicorn/no-null
            status: 'InProgress'
          } satisfies InProgressUploadStatusResponse
        ]
      }

      hasValidated = true
      return [
        200,
        {
          createdTime: uploadCreationTime,
          errorCode: '',
          errors: null, // eslint-disable-line unicorn/no-null
          id: TEST_OPERATION_ID,
          lastUpdatedTime: now.toISOString(),
          message: 'success',
          status: 'Succeeded'
        } satisfies SuccessfulUploadStatusResponse
      ]
    })

    const uploadPackagePromise = uploadPackage(
      TEST_PRODUCT_ID,
      TEST_ZIP_PATH,
      TEST_API_KEY,
      TEST_CLIENT_ID
    )
    await vi.waitUntil(() => uploadCreationTime !== undefined, { interval: 0 })
    vi.advanceTimersByTime(10 * 60 * 1000)
    await expect(uploadPackagePromise).resolves.toBeUndefined()
    expect(hasValidated).toBe(true)
    expect(Date.now()).toBe(10 * 60 * 1000)
  })

  test('upload creation failed', async () => {
    let createUploadRequestSent = false

    mockAdapter
      .onPost(URL_CREATE_UPLOAD, undefined, { headers: AUTH_HEADERS_MATCHER })
      .reply(() => {
        createUploadRequestSent = true
        return [500, 'Internal Server Error']
      })

    await expect(
      uploadPackage(TEST_PRODUCT_ID, TEST_ZIP_PATH, TEST_API_KEY, TEST_CLIENT_ID)
    ).rejects.toThrow()
    expect(createUploadRequestSent).toBe(true)
  })

  test('upload validation failed', async () => {
    let uploadCreationTime: string | undefined = undefined

    mockAdapter
      .onPost(URL_CREATE_UPLOAD, undefined, { headers: AUTH_HEADERS_MATCHER })
      .replyOnce(() => {
        uploadCreationTime = new Date().toISOString()
        return [204, undefined, { location: TEST_OPERATION_ID }]
      })

    mockAdapter.onGet(URL_VALIDATE_UPLOAD, { headers: AUTH_HEADERS_MATCHER }).replyOnce(_ => {
      assert(uploadCreationTime)
      return [
        200,
        {
          createdTime: uploadCreationTime,
          errorCode: 'ERR_FOUL',
          errors: [{ message: 'foul' }],
          id: TEST_OPERATION_ID,
          lastUpdatedTime: new Date().toISOString(),
          message: 'Foul.',
          status: 'Failed'
        } satisfies FailedUploadStatusResponse
      ]
    })

    const uploadPackagePromise = uploadPackage(
      TEST_PRODUCT_ID,
      TEST_ZIP_PATH,
      TEST_API_KEY,
      TEST_CLIENT_ID
    )
    await vi.waitUntil(() => uploadCreationTime !== undefined, { interval: 0 })
    vi.advanceTimersByTime(10 * 60 * 1000)
    try {
      await uploadPackagePromise
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(EdgeAddonActionError)
      expect(e).toHaveProperty('code', ERR_UPLOADING_PACKAGE)
    }
    expect(Date.now()).toBe(10 * 60 * 1000)
  })

  test('timeout exceeded', async () => {
    let uploadCreationTime: string | undefined = undefined

    mockAdapter
      .onPost(URL_CREATE_UPLOAD, undefined, { headers: AUTH_HEADERS_MATCHER })
      .replyOnce(() => {
        uploadCreationTime = new Date().toISOString()
        return [204, undefined, { location: TEST_OPERATION_ID }]
      })

    mockAdapter.onGet(URL_VALIDATE_UPLOAD, { headers: AUTH_HEADERS_MATCHER }).reply(_ => {
      assert(uploadCreationTime)
      return [
        200,
        {
          createdTime: uploadCreationTime,
          errorCode: null, // eslint-disable-line unicorn/no-null
          errors: null, // eslint-disable-line unicorn/no-null
          id: TEST_OPERATION_ID,
          lastUpdatedTime: new Date().toDateString(),
          message: null, // eslint-disable-line unicorn/no-null
          status: 'InProgress'
        } satisfies InProgressUploadStatusResponse
      ]
    })

    const uploadPackagePromise = uploadPackage(
      TEST_PRODUCT_ID,
      TEST_ZIP_PATH,
      TEST_API_KEY,
      TEST_CLIENT_ID
    )
    await vi.waitUntil(() => uploadCreationTime !== undefined, { interval: 0 })
    const advanceTimerPromise = vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    try {
      await uploadPackagePromise
    } catch (e) {
      expect(e).toBeInstanceOf(EdgeAddonActionError)
      expect(e).toHaveProperty('code', ERR_UPLOADING_PACKAGE)
    }

    // Let the timer finish and check the time.
    await advanceTimerPromise
    expect(Date.now()).toBe(10 * 60 * 1000)
  })
})

describe('publishPackage', () => {
  let mockAdapter: AxiosMockAdapter

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(0)
    mockAdapter = new AxiosMockAdapter(axios)
  })

  afterEach(() => {
    mockAdapter.restore()
    vi.useRealTimers()
  })

  test('happy path', async () => {
    let hasValidated = false
    let publishCreationTime: string | undefined = undefined

    mockAdapter
      .onPost(URL_CREATE_PUBLISH, { notes: APPROVAL_NOTES }, { headers: AUTH_HEADERS_MATCHER })
      .replyOnce(() => {
        publishCreationTime = new Date().toISOString()
        return [204, undefined, { location: TEST_OPERATION_ID }]
      })

    mockAdapter.onGet(URL_VALIDATE_PUBLISH, { headers: AUTH_HEADERS_MATCHER }).replyOnce(_ => {
      assert(publishCreationTime)

      const now = new Date()
      if (now.getTime() < 9 * 60 * 1000) {
        return [
          200,
          {
            createdTime: publishCreationTime,
            errorCode: null, // eslint-disable-line unicorn/no-null
            errors: null, // eslint-disable-line unicorn/no-null
            id: TEST_OPERATION_ID,
            lastUpdatedTime: now.toISOString(),
            message: null, // eslint-disable-line unicorn/no-null
            status: 'InProgress'
          } satisfies InProgressPublishStatusResponse
        ]
      }

      hasValidated = true
      return [
        200,
        {
          createdTime: publishCreationTime,
          errorCode: '',
          errors: null, // eslint-disable-line unicorn/no-null
          id: TEST_OPERATION_ID,
          lastUpdatedTime: now.toISOString(),
          message: 'success',
          status: 'Succeeded'
        } satisfies SuccessfulPublishStatusResponse
      ]
    })

    const publishPackagePromise = publishPackage(
      TEST_PRODUCT_ID,
      TEST_API_KEY,
      TEST_CLIENT_ID,
      APPROVAL_NOTES
    )
    await vi.waitUntil(() => publishCreationTime !== undefined, { interval: 0 })
    vi.advanceTimersByTime(10 * 60 * 1000)
    await expect(publishPackagePromise).resolves.toBeUndefined()
    expect(hasValidated).toBe(true)
    expect(Date.now()).toBe(10 * 60 * 1000)
  })

  test('publish creation failed', async () => {
    let createPublishRequestSent = false

    mockAdapter
      .onPost(URL_CREATE_PUBLISH, undefined, { headers: AUTH_HEADERS_MATCHER })
      .reply(() => {
        createPublishRequestSent = true
        return [500, 'Internal Server Error']
      })

    await expect(
      publishPackage(TEST_PRODUCT_ID, TEST_API_KEY, TEST_CLIENT_ID, NO_APPROVAL_NOTES)
    ).rejects.toThrow()
    expect(createPublishRequestSent).toBe(true)
  })

  test('publish validation failed', async () => {
    let publishCreationTime: string | undefined = undefined

    mockAdapter
      .onPost(URL_CREATE_PUBLISH, undefined, { headers: AUTH_HEADERS_MATCHER })
      .replyOnce(() => {
        publishCreationTime = new Date().toISOString()
        return [204, undefined, { location: TEST_OPERATION_ID }]
      })

    mockAdapter.onGet(URL_VALIDATE_PUBLISH, { headers: AUTH_HEADERS_MATCHER }).replyOnce(_ => {
      assert(publishCreationTime)
      return [
        200,
        {
          createdTime: publishCreationTime,
          errorCode: 'ERR_FOUL',
          errors: [{ message: 'foul' }],
          id: TEST_OPERATION_ID,
          lastUpdatedTime: new Date().toISOString(),
          message: 'Foul.',
          status: 'Failed'
        } satisfies FailedPublishStatusResponse
      ]
    })

    const publishPackagePromise = publishPackage(
      TEST_PRODUCT_ID,
      TEST_API_KEY,
      TEST_CLIENT_ID,
      NO_APPROVAL_NOTES
    )
    await vi.waitUntil(() => publishCreationTime !== undefined, { interval: 0 })
    vi.advanceTimersByTime(10 * 60 * 1000)
    try {
      await publishPackagePromise
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(EdgeAddonActionError)
      expect(e).toHaveProperty('code', ERR_PUBLISHING_PACKAGE)
    }
    expect(Date.now()).toBe(10 * 60 * 1000)
  })

  test('timeout exceeded', async () => {
    let publishCreationTime: string | undefined = undefined

    mockAdapter
      .onPost(URL_CREATE_PUBLISH, undefined, { headers: AUTH_HEADERS_MATCHER })
      .replyOnce(() => {
        publishCreationTime = new Date().toISOString()
        return [204, undefined, { location: TEST_OPERATION_ID }]
      })

    mockAdapter.onGet(URL_VALIDATE_PUBLISH, { headers: AUTH_HEADERS_MATCHER }).reply(_ => {
      assert(publishCreationTime)
      return [
        200,
        {
          createdTime: publishCreationTime,
          errorCode: null, // eslint-disable-line unicorn/no-null
          errors: null, // eslint-disable-line unicorn/no-null
          id: TEST_OPERATION_ID,
          lastUpdatedTime: new Date().toDateString(),
          message: null, // eslint-disable-line unicorn/no-null
          status: 'InProgress'
        } satisfies InProgressUploadStatusResponse
      ]
    })

    const publishPackagePromise = publishPackage(
      TEST_PRODUCT_ID,
      TEST_API_KEY,
      TEST_CLIENT_ID,
      NO_APPROVAL_NOTES
    )
    await vi.waitUntil(() => publishCreationTime !== undefined, { interval: 0 })
    const advanceTimerPromise = vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    try {
      await publishPackagePromise
    } catch (e) {
      expect(e).toBeInstanceOf(EdgeAddonActionError)
      expect(e).toHaveProperty('code', ERR_PUBLISHING_PACKAGE)
    }

    // Let the timer finish and check the time.
    await advanceTimerPromise
    expect(Date.now()).toBe(10 * 60 * 1000)
  })
})
