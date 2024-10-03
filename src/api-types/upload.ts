// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-is-still-in-progress
export interface InProgressUploadStatusResponse {
  id: string // Operation ID
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'InProgress'
  message: null
  errorCode: null
  errors: null
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-succeeds
export interface SuccessfulUploadStatusResponse {
  id: string // Operation ID
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Succeeded'
  message: string
  errorCode: ''
  errors: null
}

// https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/api/addons-api-reference?tabs=v1-1#response-when-the-operation-fails-with-errors
export interface FailedUploadStatusResponse {
  id: string // Operation ID
  createdTime: string // Date
  lastUpdatedTime: string // Date
  status: 'Failed'
  message?: string
  errorCode?: string // Not very sure about the code list
  errors?: unknown[] // Not very sure what the error list looks like; possibly { message: string }[]
}

export type UploadStatusResponse =
  | InProgressUploadStatusResponse
  | SuccessfulUploadStatusResponse
  | FailedUploadStatusResponse
