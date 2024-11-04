import { Gender } from "@empowered/constants";

/**
 * Used for displaying language strings on template since Gender enums aren't copy friendly.
 *
 * @property display {string} - language string for displaying on template
 * @property gender {Gender} - enum values that come from static endpoint
 */
export interface DisplayGender {
    display: string;
    gender: Gender;
}

// Unlike most copy that gets translated using Language Strings, these units should never be translated
export enum SymbolOrUnit {
    "PER_HOUR" = "/ hr",
    "MULTIPLICATION" = "x",
    "HOURS_PER_WEEK" = "hrs / wk",
    "WEEKS_PER_YEAR" = "wks / yr",
    "EQUALS" = "=",
}
