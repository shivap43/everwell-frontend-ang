import { Inject, Injectable, Optional } from "@angular/core";
import { DateAdapter, MAT_DATE_LOCALE } from "@angular/material/core";
import {
    getMonth,
    getYear,
    getDate,
    getDay,
    formatISO,
    isDate,
    format,
    parseISO,
    parse,
    setDay,
    isValid,
    addDays,
    addMonths,
    addYears,
    getDaysInMonth,
} from "date-fns";

function range<T>(length: number, valueFunction: (index: number) => T): T[] {
    const valuesArray = Array(length);
    for (let i = 0; i < length; i++) {
        valuesArray[i] = valueFunction(i);
    }
    return valuesArray;
}

const MONTH_FORMATS = {
    long: "LLLL",
    short: "LLL",
    narrow: "LLLLL",
};

const DAY_OF_WEEK_FORMATS = {
    long: "EEEE",
    short: "EEE",
    narrow: "EEEEE",
};

const NUMERIC = "numeric";
const UTC = "utc";

@Injectable()
export class DateFnsDateAdapter extends DateAdapter<Date> {
    constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string) {
        super();
        this.setLocale(matDateLocale);
    }

    getYear(date: Date): number {
        return getYear(date);
    }

    getMonth(date: Date): number {
        return getMonth(date);
    }

    getDate(date: Date): number {
        return getDate(date);
    }

    getDayOfWeek(date: Date): number {
        return getDay(date);
    }

    getMonthNames(style: "long" | "short" | "narrow"): string[] {
        const pattern = MONTH_FORMATS[style];
        const date = new Date();
        return range(12, (i) => this.format(new Date(date.getFullYear(), i, 1), pattern));
    }

    getDateNames(): string[] {
        const dtf =
            typeof Intl !== "undefined"
                ? new Intl.DateTimeFormat(this.locale.code, {
                    day: NUMERIC,
                    timeZone: UTC,
                })
                : null;

        return range(31, (i) => {
            if (dtf) {
                // Fall back to `Intl` on supported browsers.
                const date = new Date();
                date.setUTCFullYear(date.getUTCFullYear(), 0, i + 1);
                date.setUTCHours(0, 0, 0, 0);
                return dtf.format(date).replace(/[\u200e\u200f]/g, "");
            }

            return i + "";
        });
    }

    getDayOfWeekNames(style: "long" | "short" | "narrow"): string[] {
        const pattern = DAY_OF_WEEK_FORMATS[style];
        const date = new Date();
        return range(7, (month) => this.format(setDay(date, month), pattern));
    }

    getYearName(date: Date): string {
        return this.format(date, "y");
    }

    getFirstDayOfWeek(): number {
        return this.locale.options?.weekStartsOn ?? 0;
    }

    getNumDaysInMonth(date: Date): number {
        return getDaysInMonth(date);
    }

    clone(date: Date): Date {
        return new Date(date.getTime());
    }

    createDate(year: number, month: number, date: number): Date {
        // Check for invalid month and date
        if (month < 0 || month > 11) {
            throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
        }

        if (date < 1) {
            throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
        }

        const result = new Date();
        result.setFullYear(year, month, date);
        result.setHours(0, 0, 0, 0);

        // Check for upper bound of date, so month doesn't increment automatically
        if (result.getMonth() !== month) {
            throw Error(`Invalid date "${date}" for month with index "${month}".`);
        }

        return result;
    }

    today(): Date {
        return new Date();
    }

    parse(value: string | Date | number, parseFormat: string | string[]): Date | null {
        if (typeof value == "string" && value.length > 0) {
            const iso8601Date = parseISO(value);

            if (this.isValid(iso8601Date)) {
                return iso8601Date;
            }

            const formats = Array.isArray(parseFormat) ? parseFormat : [parseFormat];

            if (!parseFormat.length) {
                throw Error("Formats array must not be empty.");
            }

            for (const currentFormat of formats) {
                const fromFormat = parse(value, currentFormat, new Date(), { locale: this.locale });

                if (this.isValid(fromFormat)) {
                    return fromFormat;
                }
            }

            return this.invalid();
        } else if (typeof value === "number") {
            return new Date(value);
        } else if (value instanceof Date) {
            return this.clone(value);
        }

        return null;
    }

    format(date: Date, displayFormat: string): string {
        if (!this.isValid(date)) {
            throw Error("DateFnsAdapter: Cannot format invalid date.");
        }

        return format(date, displayFormat, { locale: this.locale });
    }

    addCalendarYears(date: Date, years: number): Date {
        return addYears(date, years);
    }

    addCalendarMonths(date: Date, months: number): Date {
        return addMonths(date, months);
    }

    addCalendarDays(date: Date, days: number): Date {
        return addDays(date, days);
    }

    toIso8601(date: Date): string {
        return formatISO(date, { representation: "date" });
    }

    /**
     * Returns the passed value as Date object or null for nullish values
     * Deserializes ISO8601 strings
     * @param value - ISO8601 date string/ Date object
     * @returns date object or null
     */
    deserialize(value: string | Date): Date | null {
        if (typeof value === "string") {
            if (!value) {
                return null;
            }
            const date = parseISO(value);
            if (this.isValid(date)) {
                return date;
            }
        }
        return super.deserialize(value);
    }

    isDateInstance(obj: unknown): boolean {
        return isDate(obj);
    }

    isValid(date: Date): boolean {
        return isValid(date);
    }

    invalid(): Date {
        return new Date(NaN);
    }
}
