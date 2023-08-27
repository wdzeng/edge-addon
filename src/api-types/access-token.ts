export type AccessTokenResponse = AccessTokenSuccessResponse | AccessTokenErrorResponse

// https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow#successful-response-1
export interface AccessTokenSuccessResponse {
  token_type: string
  expires_in: number
  access_token: string
}

// 400 Bad Request
// https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow#error-response-1
export interface AccessTokenErrorResponse {
  error: string
  error_description: string
  error_codes: number[]
  timestamp: string // YYYY-MM-DD HH:MM:SSZ
  trace_id: string
  correlation_id: string
}
