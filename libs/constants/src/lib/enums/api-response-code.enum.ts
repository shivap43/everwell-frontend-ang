export enum SuccessResponseCode {
    "RESP_200" = 200,
    "RESP_201" = 201,
    "RESP_202" = 202,
    "RESP_204" = 204,
}

export enum RedirectResponseCode {
    "RESP_300" = 300,
    "RESP_301" = 301,
    "RESP_302" = 302,
    "RESP_303" = 303,
    "RESP_304" = 304,
    "RESP_307" = 307,
}

export enum ClientErrorResponseCode {
    "RESP_400" = 400,
    "RESP_401" = 401,
    "RESP_403" = 403,
    "RESP_404" = 404,
    "RESP_405" = 405,
    "RESP_406" = 406,
    "RESP_408" = 408,
    "RESP_409" = 409,
    "RESP_412" = 412,
    "RESP_413" = 413,
    "RESP_415" = 415,
}

export enum ServerErrorResponseCode {
    "RESP_500" = 500,
    "RESP_501" = 501,
    "RESP_503" = 503,
    "RESP_504" = 504,
}

export enum ClientErrorResponseType {
    "MISSING_PARAMETER" = "missingParameter",
    "BAD_PARAMETER" = "badParameter",
    "DUPLICATE" = "duplicate",
    "SELF_DUPLICATE" = "selfDuplicate",
    "CSRF_MISMATCH" = "csrfMismatch",
    "LOCKED" = "locked",
    "FORBIDDEN" = "forbidden",
    "PREREQUISITE_FAILED" = "prerequisiteFailed",
    "INVALID_STATE" = "invalidState",
    "INVALID_ZIP" = "invalidZip",
    "INVALID_APPLICATION_STATE" = "invalidApplicationState",
    "BAD_DATA" = "badData",
    "BAD_REQUEST" = "badRequest",
    "HISTORY_MATCH" = "historyMatch",
    "NOT_FOUND" = "notFound",
    "NOT_AUTHORIZED" = "notAuthorized",
    "SSO_REQUIRED" = "ssoRequired",
    "CONFLICT" = "conflict",
    "UNSUPPORTED_MEDIA_TYPE" = "unsupportedMediaType",
}
export enum ClientErrorResponseDetailCodeType {
    "VALID_EMAIL" = "ValidEmail",
    "ZIP_CODE" = "ZipCode",
    "RESTRICTED_EMAIL" = "emailAddress.email",
    "EMAIL" = "email",
    "VALID_PATTERN" = "ValidPattern",
    "VALID_PHONE" = "ValidPhone",
    "GROUP_MAINTENANCE" = "groupMaintenance",
}

export enum ApiResponseData {
    "RESP_HEADER_LOCATION" = "location",
}
