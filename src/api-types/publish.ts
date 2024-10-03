// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-publish-call-fails-with-an-unexpected-failure
export interface UnexpectedPublishStatusResponse {
  id: string
  message: string
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-publish-call-succeeds
export interface SuccessfulPublishStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Succeeded'
  message: string
  errorCode: ''
  errors: null
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-is-still-in-progress
export interface InProgressPublishStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'InProgress'
  message: null
  errorCode: null
  errors: null
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-fails-with-errors
export interface FailedPublishStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Failed'
  message: string | null
  errorCode: null | string
  errors: null | { message: string }[]
}

type ExpectedPublishStatusResponse =
  | SuccessfulPublishStatusResponse
  | FailedPublishStatusResponse
  | InProgressPublishStatusResponse

export type PublishStatusResponse = UnexpectedPublishStatusResponse | ExpectedPublishStatusResponse
