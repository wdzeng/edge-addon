// Here are types of responses of upload and publishing status.
//
// - Upload API:
//   https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#response-1
// - Publishing API:
//   https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference#response-3
//
// The API documentation sucks. It does not provide correct response type. I guess upload API and
// publishing API share the same response type.

interface UnexpectedStatusResponse {
  id: string
  message: string
}

interface SuccessfulStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Succeeded'
  message: string
  errorCode: ''
  errors: null
}

interface InProgressStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'InProgress'
  message: null
  errorCode: null
  errors: null
}

export interface FailedStatusResponse {
  id: string
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Failed'
  message: string | null
  errorCode: null | string
  errors: null | { message: string }[]
}

export type ExpectedStatusResponse =
  | SuccessfulStatusResponse
  | FailedStatusResponse
  | InProgressStatusResponse

export type StatusResponse = UnexpectedStatusResponse | ExpectedStatusResponse
