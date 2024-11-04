import { Injectable } from "@angular/core";
import {
    differenceInYears,
    differenceInDays,
    toDate,
    isAfter,
    isBefore,
    isEqual,
    parse,
    addDays,
    subDays,
    addYears,
    addMonths,
    setDate,
    format,
    max,
    isValid,
    startOfWeek,
    isToday,
    lastDayOfMonth,
    min,
    subYears,
    startOfDay,
    endOfDay,
    getDaysInMonth,
    addHours,
    subMonths,
    subSeconds,
    getISOWeek,
    getWeek,
    isSameDay,
} from "date-fns";
import { DateFormats } from "@empowered/constants";

const HYPHEN = "-";
const DATE_LENGTH = 10;

@Injectable({
    providedIn: "root",
})
export class DateService {
    /**
     * Get number of years before current date
     */
    getYearsFromNow(date: Date | number): number {
        return differenceInYears(Date.now(), date);
    }

    /**
     * Returns difference among two dates in days
     * For example dateLeft = 09-15-2022, dateRight = 09-10-2020, so the difference would be dateLeft - dateRight i.e. 5 days
     */
    getDifferenceInDays(dateLeft: Date | number | string, dateRight: Date | number | string): number {
        return differenceInDays(this.toDate(dateLeft), this.toDate(dateRight));
    }

    /**
     * check if today's date or a given date is in between given 2 dates
     * @param startDate start date range
     * @param endDate end date range
     * @param dateToCompare date to compare if it falls within startDate and endDate
     * @returns boolean true or false
     */
    isBetween(startDate: Date | number, endDate: Date | number, dateToCompare?: Date | number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dateToCompare
            ? (isAfter(dateToCompare, startDate) || isSameDay(dateToCompare, startDate)) &&
                  (isBefore(dateToCompare, endDate) || isSameDay(dateToCompare, endDate))
            : (isAfter(today, startDate) || isSameDay(today, startDate)) && (isBefore(today, endDate) || isSameDay(today, endDate));
    }

    getToDate(date: Date | number): Date {
        return toDate(date);
    }

    /**
     * Returns date based on the format of the input date
     * @param date in string format
     * @param formatType format of the date string
     */
    parseDate(date: string, formatType: string): Date {
        return parse(date, formatType, new Date());
    }

    /**
     * Checks if date is after dateToCompare/today's date
     * @param date date to compare
     * @param dateToCompare date to compare against
     * @returns true/false
     */
    checkIsAfter(date: Date | number | string, dateToCompare?: Date | number | string): boolean {
        return dateToCompare ? isAfter(this.toDate(date), this.toDate(dateToCompare)) : isAfter(this.toDate(date), new Date());
    }

    /**
     * Checks if dateLeft is after or equal to dateRight or current date
     * @param dateLeft date to compare
     * @param dateRight date to compare against
     * @returns true/false
     */
    getIsAfterOrIsEqual(dateLeft: Date | number | string, dateRight?: Date | number | string): boolean {
        const today = new Date();
        return dateRight
            ? isAfter(this.toDate(dateLeft), this.toDate(dateRight)) || isSameDay(this.toDate(dateLeft), this.toDate(dateRight))
            : isAfter(this.toDate(dateLeft), today) || isToday(this.toDate(dateLeft));
    }

    /**
     * @param date  date in yyyy-mm-dd/mm-dd-yyyy format
     * @returns true if date is today or in the past
     */
    checkIsTodayOrBefore(date: string): boolean {
        return this.toDate(date) <= new Date();
    }

    /**
     * @param date date in yyyy-mm-dd/mm-dd-yyyy format
     * @returns true if date is today or in the future
     */
    checkIsTodayOrAfter(date: string): boolean {
        return this.toDate(date).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);
    }

    /**
     * Function will return true if the dateToCompare is in past date else false
     * @param dateToCompare date from which we need to compare
     * @returns boolean true if dateToCompare is in past
     */
    isBefore(dateToCompare: Date | number | string, dateToCompareAgainst?: Date | string): boolean {
        return dateToCompareAgainst
            ? isBefore(this.toDate(dateToCompare), this.toDate(dateToCompareAgainst))
            : isBefore(this.toDate(dateToCompare), Date.now());
    }

    /**
     * Function adds days to the provided date and returns a new date
     * @param date Date to add days
     * @param daysToAdd number of days add to the date passed
     * @returns Date with added days
     */
    addDays(date: Date, daysToAdd: number): Date {
        return addDays(date, daysToAdd);
    }

    /**
     * Function adds hours to the provided date and returns a new date
     * @param date Date to add hours
     * @param daysToAdd number of hours add to the date passed
     * @returns Date with added hours
     */
    addHours(date: Date, hoursToAdd: number): Date {
        return addHours(date, hoursToAdd);
    }

    /**
     * Function subtracts days to the provided date and returns a new date
     * @param date Date to subtract days
     * @param daysToSubtract number of days to subtract
     * @returns Date with subtracted days
     */
    subtractDays(date: Date, daysToSubtract: number): Date {
        return subDays(date, daysToSubtract);
    }

    /**
     * Function subtracts months from the provided date and returns a new date
     * @param date Date to subtract month
     * @param monthsToSubtract number of month to subtract
     * @returns Date with subtracted months
     */
    subtractMonths(date: Date, monthsToSubtract: number): Date {
        return subMonths(date, monthsToSubtract);
    }

    /**
     * Function subtracts seconds from the provided date and returns a new date
     * @param date Date to subtract seconds
     * @param monthsToSubtract number of seconds to subtract
     * @returns Date with subtracted seconds
     */
    subtractSeconds(date: Date, secondsToSubtract: number): Date {
        return subSeconds(date, secondsToSubtract);
    }

    /**
     * Returns true if the passed date has a difference of the provided number
     * of days against refDate/currentDate in the past. Will check against current date if refDate is not provided
     * @param date Date to compare
     * @param diffInDays Difference in days to check
     * @param refDate Date to compare against
     * @returns boolean if the date has said amount of days difference in the past
     */
    isInPastByDays(date: Date, diffInDays: number, refDate?: Date): boolean {
        return refDate ? isEqual(date, subDays(refDate, diffInDays)) : isSameDay(date, subDays(new Date(), diffInDays));
    }

    /**
     * Returns true if the passed date has a difference of the provided number
     * of days against refDate/currentDate in the future. Will check against current date if refDate is not provided
     * @param date Date to compare
     * @param diffInDays Difference in days
     * @param refDate Date to compare against
     * @returns boolean if the date has said amount of days difference in the future
     */
    isInFutureByDays(date: Date, diffInDays: number, refDate?: Date): boolean {
        return refDate ? isEqual(date, addDays(refDate, diffInDays)) : isSameDay(date, addDays(new Date(), diffInDays));
    }

    /**
     * Function to return date after adding given number of years
     * @param date Date to add years
     * @param yearsToAdd number of years to add
     */
    addYears(date: Date, yearsToAdd: number): Date {
        return addYears(date, yearsToAdd);
    }

    /**
     * Function to return date after adding given number of months
     * @param date Date to add months
     * @param monthsToAdd number of months to add
     */
    addMonths(date: Date, monthsToAdd: number): Date {
        return addMonths(date, monthsToAdd);
    }

    /**
     * Function will return fist of next month
     * @param currentMonthDate date from which next month is calculated
     * @returns first date of next month
     */
    getFirstOfNextMonth(currentMonthDate: Date): Date {
        // startOfMonth date-fns has a known issue which returns last day of current month
        return setDate(addMonths(currentMonthDate, 1), 1);
    }

    /**
     * Will return true or false if a dateLeft is before or equal to dateRight or current date
     * @param dateLeft Date to compare
     * @param dateRight date to compare against
     * @returns boolean
     */
    isBeforeOrIsEqual(dateLeft: Date | number | string, dateRight?: Date | number | string) {
        return dateRight
            ? isBefore(this.toDate(dateLeft), this.toDate(dateRight)) || isSameDay(this.toDate(dateLeft), this.toDate(dateRight))
            : isBefore(this.toDate(dateLeft), new Date()) || isToday(this.toDate(dateLeft));
    }

    /**
     * Converts date to any specified type of format
     * @param date date to be formatted
     * @param dateFormat string format in which given date is to be formatted
     * @returns date as a string with the specified formatting
     */
    format(date: Date | number | string, dateFormat: string): string {
        const dateToBeFormatted = this.toDate(date);
        return isValid(dateToBeFormatted) && !!dateFormat ? format(dateToBeFormatted, dateFormat) : "";
    }

    /**
     * Returns tru/false if date is equal to dateToCompare/today
     * @param date date to compare
     * @param dateToCompare date to compare against
     * @returns boolean
     */
    isEqual(date: Date | number | string, dateToCompare?: Date | string): boolean {
        return dateToCompare ? isEqual(this.toDate(date), this.toDate(dateToCompare)) : isToday(this.toDate(date));
    }

    /**
     * Finds the greatest date among the given array of dates
     * @param dates Array of dates to compare
     * @returns The greatest dates among the array
     */
    max(dates: Date[]): Date {
        return max(dates);
    }

    /**
     * Checks whether a date is valid
     * @param date date to check
     * @returns true/false if date is valid
     */
    isValid(date: Date | number): boolean {
        return isValid(date);
    }

    /**
     * Function to get a day before net year
     * @param inputDate current input date
     * @returns one date less to next year
     */
    getOneDayLessThanYear(inputDate: Date): Date {
        const nextYear = addYears(inputDate, 1);
        return subDays(nextYear, 1);
    }

    /**
     * Returns first day of consecutive month with format
     * @param inputDate start date
     * @param months number of months to be added
     * @param dateFormat format type for date
     * @returns formatted first day of consecutive months
     */
    getFormattedFirstOfMonths(inputDate: Date, months: number, dateFormat: string): string {
        return format(setDate(addMonths(inputDate, months), 1), dateFormat);
    }

    /**
     * Returns an array of weekday names [Monday, Tuesday, ...]
     * @param numOfDays number of weekdays required
     * @returns Array of weekday names
     */
    getWeekdaysName(numOfDays: number): string[] {
        return Array(numOfDays)
            .fill(undefined)
            .map((_, index) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), "EEEE"));
    }

    /**
     * Convert string to date based on the input date format
     * @param date in string format
     */
    toDate(date?: string | Date | number | null): Date {
        if (date === undefined) {
            // moment(undefined) is current time
            return new Date();
        }
        if (typeof date === "string" && date.includes(HYPHEN) && date.length === DATE_LENGTH) {
            return this.parseDate(date, DateFormats.YEAR_MONTH_DAY);
        }
        // moment(null) is invalid object
        return date !== null && isValid(new Date(date)) ? this.getToDate(new Date(date)) : new Date("");
    }

    /**
     * Get difference in years of date from current day or fromDate
     * @param date date to calculate the difference
     * @param fromDate date from which to calculate the difference
     * @returns difference in years
     */
    getDifferenceInYears(date: Date | number | string, fromDate?: Date | number | string): number {
        return fromDate ? differenceInYears(this.toDate(fromDate), this.toDate(date)) : differenceInYears(new Date(), this.toDate(date));
    }

    /**
     * Returns the last date of the month
     * @param date Date containing the month for which last Date needs to be calculated
     * @returns Last date of the month
     */
    getLastDayOfMonth(date: Date | number | string): number {
        return lastDayOfMonth(this.toDate(date)).getDate();
    }

    /**
     * Returns the earliest date from the array of dates
     * @param dates Array of dates
     * @returns Returns the earliest date within the array
     */
    min(dates: Date[]): Date {
        return min(dates.filter((date) => !!date && isValid(date)));
    }

    /**
     * Returns the year of birth with age as input
     * @param age age as per today
     * @return year of birth
     */
    getYearOfBirthFromToday(age: number): Date {
        return addDays(subYears(new Date(), age), 1);
    }

    /**
     * Returns start time of the date
     * @param date date for each start time is needed
     * @returns date with start time of the day
     */
    getStartOfDay(date?: Date | string | number): Date {
        return startOfDay(date ? this.toDate(date) : new Date());
    }

    /**
     * Returns end time of the date
     * @param date  date for each end time is needed
     * @returns date with end time of the day
     */
    getEndOfDay(date?: Date | string | number): Date {
        return endOfDay(date ? this.toDate(date) : new Date());
    }

    /**
     * Returns number of days in the month present given date
     * @param date to get the month
     * @returns number of months in given date
     */
    getDaysInMonth(date: Date): number {
        return getDaysInMonth(date);
    }

    /**
     * Returns the number of the week
     * @param date date to find the week
     * @param isISO check for iso week number
     * @returns number of the week
     */
    getWeekNumber(date: Date, isISO: boolean): number {
        return isISO ? getISOWeek(date) : getWeek(date);
    }
}
