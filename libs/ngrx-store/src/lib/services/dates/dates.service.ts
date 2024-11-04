import { Injectable } from "@angular/core";
import { isBefore, isAfter, differenceInDays, isEqual, isValid } from "date-fns";

/**
 * Returns date object in proper timezone
 * @param dateString dateString to be converted to date object
 * @returns date object or null
 */
export const toDateObj = (dateString?: string | Date | null): Date => {
    if (dateString === undefined) {
        return new Date();
    }
    if (typeof dateString === "string") {
        return new Date(dateString.replace(new RegExp("-", "g"), "/"));
    }
    return dateString !== null && isValid(dateString) ? dateString : new Date("");
};

/**
 * Returns the earliest of the date strings
 *
 * @param possibleDates {(string | null)[]} Array of date strings with format DateFormat.YEAR_MONTH_DAY_UPPERCASE (nullable)
 * @returns {string | null} null if possibleDates is empty or doesn't have any strings with format DateFormat.YEAR_MONTH_DAY_UPPERCASE
 */
export const getEarliestDate = (possibleDates: (string | null)[]): string | null =>
    possibleDates.reduce<string | null>((earliestDate, nextDate) => {
        if (!nextDate) {
            return earliestDate;
        }

        if (!earliestDate) {
            return nextDate;
        }

        const earliestMoment = new Date(toDateObj(earliestDate));
        const nextMoment = new Date(toDateObj(nextDate));

        if (isBefore(nextMoment, earliestMoment)) {
            return nextDate;
        }

        return earliestDate;
    }, null);

/**
 * Returns true if possibleDate is between earliest and latest date
 *
 * @param possibleDate {string} Possible date that might be between range
 * @param earliestDate {string | null} Earliest date. If null, this date is ignored
 * @param latestDate {string | null} Latest date. If null, this date is ignored
 * @returns {boolean} Returns true if possibleDate is between earliest and latest date
 */
export const dateIsBetweenRange = (possibleDate: string, earliestDate?: string | null, latestDate?: string | null): boolean => {
    const possibleMoment = new Date(toDateObj(possibleDate));

    if (earliestDate) {
        const earliestMoment = new Date(toDateObj(earliestDate));

        if (isBefore(possibleMoment, earliestMoment)) {
            return false;
        }
    }

    if (latestDate) {
        const latestMoment = new Date(toDateObj(latestDate));

        if (isAfter(possibleMoment, latestMoment)) {
            return false;
        }
    }

    return true;
};

/**
 * Checks if date is past date or not. Ignores minutes, seconds, milliseconds.
 * @param possibleDate {moment.MomentInput} possible date value
 *
 * @returns boolean indicating if past date or not
 */
export const isPastDate = (possibleDate?: string | Date): boolean => {
    const possibleMoment = new Date(toDateObj(possibleDate)).setHours(0, 0, 0, 0);
    const currentDate = new Date().setHours(0, 0, 0, 0);

    return isBefore(possibleMoment, currentDate);
};

/**
 * Returns the difference in days between two dates. Ignores precedence of earlier/late date.
 * @param dateLeft date object
 * @param dateRight date object
 * @returns number of days between dateLeft and dateRight.
 */
export const getDifferenceInDays = (dateLeft: Date | number, dateRight: Date | number): number => differenceInDays(dateLeft, dateRight);

/**
 * Checks if dateLeft is after or equal to dateRight
 * @param dateLeft date object to check
 * @param dateRight date object to compare against
 * @returns boolean
 */
export const isAfterOrEqual = (dateLeft: Date | number, dateRight: Date | number): boolean =>
    isAfter(dateLeft, dateRight) || isEqual(dateLeft, dateRight);

/**
 * Checks if dateLeft is before or equal to dateRight
 * @param dateLeft date object to check
 * @param dateRight date object to compare against
 * @returns boolean
 */
export const isBeforeOrEqual = (dateLeft: Date | number, dateRight: Date | number): boolean =>
    isBefore(dateLeft, dateRight) || isEqual(dateLeft, dateRight);

/**
 * Checks if dateLeft is after dateRight
 * @param dateLeft date to compare
 * @param dateRight date to compare against
 * @returns boolean
 */
export const checkIfAfter = (dateLeft: Date | number, dateRight: Date | number): boolean => isAfter(dateLeft, dateRight);

/**
 * Checks if dateLeft is before dateRight
 * @param dateLeft date to compare
 * @param dateRight date to compare against
 * @returns boolean
 */
export const checkIfBefore = (dateLeft: Date | number, dateRight: Date | number): boolean => isBefore(dateLeft, dateRight);

/**
 * Checks if dateLeft is equal to dateRight
 * @param dateLeft date to compare
 * @param dateRight date to compare against
 * @returns boolean
 */
export const checkIfEqual = (dateLeft: Date | number, dateRight: Date | number): boolean => isEqual(dateLeft, dateRight);

@Injectable({
    providedIn: "root",
})
/**
 * @deprecated Please use DateService from date lib instead
 */
export class DatesService {
    /**
     * Returns the earliest of the date strings
     *
     * @param possibleDates {(string | null)[]} Array of date strings with format DateFormat.YEAR_MONTH_DAY_UPPERCASE (nullable)
     * @returns {string | null} null if possibleDates is empty or doesn't have any strings with format DateFormat.YEAR_MONTH_DAY_UPPERCASE
     */
    getEarliestDate(possibleDates: (string | null)[]): string | null {
        return getEarliestDate(possibleDates);
    }

    /**
     * Returns true if possibleDate is between earliest and latest date
     *
     * @param possibleDate {string} Possible date that might be between range
     * @param earliestDate {string | null} Earliest date. If null, this date is ignored
     * @param latestDate {string | null} Latest date. If null, this date is ignored
     * @returns {boolean} Returns true if possibleDate is between earliest and latest date
     */
    dateIsBetweenRange(possibleDate: string, earliestDate?: string | null, latestDate?: string | null): boolean {
        return dateIsBetweenRange(possibleDate, earliestDate, latestDate);
    }

    /**
     * Checks if date is past date or not. Ignores minutes, seconds, milliseconds.
     * @param possibleDate {Date} possible date value
     *
     * @returns boolean indicating if past date or not
     */
    isPastDate(possibleDate?: string | Date): boolean {
        return isPastDate(possibleDate);
    }

    /**
     * Returns the difference in days between two dates. Ignores precedence of earlier/late date.
     * @param dateLeft date object
     * @param dateRight date object
     * @returns number of days between dateLeft and dateRight.
     */
    getDifferenceInDays(dateLeft: Date | number, dateRight: Date | number): number {
        return getDifferenceInDays(dateLeft, dateRight);
    }

    /**
     * Checks if dateLeft is after or equal to dateRight
     * @param dateLeft date object to check
     * @param dateRight date object to compare against
     * @returns boolean
     */
    isAfterOrEqual(dateLeft: Date | number, dateRight: Date | number): boolean {
        return isAfterOrEqual(dateLeft, dateRight);
    }

    /**
     * Checks if dateLeft is before or equal to dateRight
     * @param dateLeft date object to check
     * @param dateRight date object to compare against
     * @returns boolean
     */
    isBeforeOrEqual(dateLeft: Date | number, dateRight: Date | number): boolean {
        return isBeforeOrEqual(dateLeft, dateRight);
    }

    /**
     * Checks if dateLeft is after dateRight
     * @param dateLeft date to compare
     * @param dateRight date to compare against
     * @returns boolean
     */
    isAfter(dateLeft: Date | number, dateRight: Date | number): boolean {
        return checkIfAfter(dateLeft, dateRight);
    }

    /**
     * Checks if dateLeft is before dateRight
     * @param dateLeft date to compare
     * @param dateRight date to compare against
     * @returns boolean
     */
    isBefore(dateLeft: Date | number, dateRight: Date | number): boolean {
        return checkIfBefore(dateLeft, dateRight);
    }

    /**
     * Checks if dateLeft is equal to dateRight
     * @param dateLeft date to compare
     * @param dateRight date to compare against
     * @returns boolean
     */
    isEqual(dateLeft: Date | number, dateRight: Date | number): boolean {
        return checkIfEqual(dateLeft, dateRight);
    }

    /**
     * Returns date object in proper timezone
     * @param dateString dateString to be converted to date object
     * @returns date object or null
     */
    toDateObj(dateString?: string | Date): Date {
        return toDateObj(dateString);
    }
}
