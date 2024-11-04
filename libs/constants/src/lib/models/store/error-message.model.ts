/**
 * General interface for displaying an error message based on ApiError (or lack of one)
 */
export interface ErrorMessage {
    language?: string;
    // Display text should be overridden if language is provided
    displayText?: string;
}
