import { ProductId, HasCoverageDates } from "@empowered/constants";

/**
 * Datepickers use Moment objects for their values instead.
 * By default they use Date objects, but this project's setup overrided that behavior.
 * To make this process of converting date strings to date object,
 * this interface will match HasCoverageDates and have date object equivalents of the date strings
 * @property defaultCoverageStartDate
 * @property earliestCoverageStartDate
 * @property latestCoverageStartDate
 */
export interface HasCoverageDateMoments {
    defaultCoverageStartDate: Date;
    earliestCoverageStartDate: Date;
    latestCoverageStartDate: Date;
}

/**
 * @property productId - Product id
 * @property productName - Product name
 * @property coverageDates - selected coverage start date for product
 */
export interface HasProductCoverageDates {
    productId: ProductId;
    productName: string;
    coverageDates: HasCoverageDates;
}

/**
 * Values used to populate template and datepicker FormControl
 *
 * @property label - that goes above Datepicker
 * @property coverageDates - date strings, used for error messages
 * @property coverageDateMoments - date Moments, used for setting default value of Datepicker and min/max range
 * @property minMaxDateDifference - number, used for setting the min/max days difference
 */
export interface CoverageDatePickerFormValues {
    label: string;
    coverageDates: HasCoverageDates;
    coverageDateMoments: HasCoverageDateMoments;
    minMaxDateDifference: number;
}
