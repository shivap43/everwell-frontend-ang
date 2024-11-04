/**
 * This modal is used to set error object to catch API errors.
 */
export interface ApiError {
    status?: string;
    errorKey?: string;
    value?: string;
    language?: LanguageDisplay;
}

/**
 * This modal is used to set language object present in API error response.
 * It is not mandatory for API error block to have language object.
 */
export interface LanguageDisplay {
    displayText?: string;
    languageTag?: string;
}
