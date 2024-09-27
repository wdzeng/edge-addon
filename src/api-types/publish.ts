// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-publish-call-fails-with-an-unexpected-failure
interface UnexpectedStatusResponse {
  id: string
  message: string
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-publish-call-succeeds
interface SuccessfulStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Succeeded'
  message: string
  errorCode: ''
  errors: null
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-is-still-in-progress
interface InProgressStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'InProgress'
  message: null
  errorCode: null
  errors: null
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-fails-with-errors
interface FailedStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Failed'
  message: string | null
  errorCode: null | string
  errors: null | { message: string }[]
}

type ExpectedStatusResponse =
  | SuccessfulStatusResponse
  | FailedStatusResponse
  | InProgressStatusResponse

export type PublishStatusResponse = UnexpectedStatusResponse | ExpectedStatusResponse
