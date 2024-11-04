import { InjectionToken } from "@angular/core";

export const LOCALE_CONFIG = new InjectionToken<LocaleConfig>("daterangepicker.config");
/**
 *  LocaleConfig Interface
 */
export interface LocaleConfig {
    direction?: string;
    separator?: string;
    weekLabel?: string;
    applyLabel?: string;
    cancelLabel?: string;
    clearLabel?: string;
    customRangeLabel?: string;
    daysOfWeek?: string[];
    monthNames?: string[];
    firstDay?: number;
    format?: string;
}
/**
 *  DefaultLocaleConfig
 */
export const DefaultLocaleConfig: LocaleConfig = {
    direction: "ltr",
    separator: " - ",
    weekLabel: "w",
    applyLabel: "Apply",
    cancelLabel: "Cancel",
    clearLabel: "Clear",
    customRangeLabel: "Custom range",
    daysOfWeek: ["Su", "Mo", "We", "Th", "Fr", "Sa"],
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    firstDay: 0,
};
