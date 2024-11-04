import { MatDateFormats } from "@angular/material/core";
import { DateFnsFormat, DateFormat } from "@empowered/constants";

const WEEK_STARTS_ON = 1;

export const DATE_FNS_FORMATS: MatDateFormats = {
    parse: {
        dateInput: DateFormat.MONTH_DAY_YEAR,
    },
    display: {
        dateInput: DateFormat.MONTH_DAY_YEAR,
        monthYearLabel: DateFnsFormat.COMPLETE_MONTH_YEAR,
        dateA11yLabel: DateFnsFormat.MONTH_DAY_COMMA_YEAR,
        monthYearA11yLabel: DateFnsFormat.COMPLETE_MONTH_YEAR,
    },
};

export const EXPIRY_DATES_FORMAT: MatDateFormats = {
    parse: {
        dateInput: DateFormat.MONTH_YEAR_LOWERCASE,
    },
    display: {
        dateInput: DateFormat.MONTH_YEAR_LOWERCASE,
        monthYearLabel: DateFnsFormat.LONG_MONTH_YEAR_LOWERCASE,
        dateA11yLabel: DateFormat.LONG_MONTH_SHORT_DAY_YEAR,
        monthYearA11yLabel: DateFnsFormat.COMPLETE_MONTH_YEAR,
    },
};

export const DATEPICKER_MONTH_YEAR_FORMAT: MatDateFormats = {
    parse: {
        dateInput: DateFormat.MONTH_YEAR_LOWERCASE,
    },
    display: {
        dateInput: DateFormat.MONTH_YEAR_LOWERCASE,
        monthYearLabel: DateFnsFormat.LONG_MONTH_YEAR_LOWERCASE,
        dateA11yLabel: DateFormat.LONG_MONTH_SHORT_DAY_YEAR,
        monthYearA11yLabel: DateFnsFormat.LONG_MONTH_YEAR_LOWERCASE,
    },
};
