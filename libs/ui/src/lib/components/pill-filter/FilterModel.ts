import { ValidatorFn } from "@angular/forms";

export type FilterType = "SINGLE" | "MULTI" | "SEARCH" | "CHIP" | "DATE";

export interface FilterOption {
    label: string;
    value: string;
    selected?: boolean;
}

export interface SingleSelectPanel {
    default: string;
    options: FilterOption[];
}

export interface MultiSelectPanel {
    isChip: boolean;
    options: FilterOption[];
}

export interface SearchInputPanel {
    value?: string;
    hint?: string;
    validator?: ValidatorFn;
}

export interface DateInputPanel {
    specific?: string;
    range?: {
        start?: string;
        end?: string;
    };
}

/**
 * Model to populate the filter panel as well as any selectable options
 *
 * NOTE: FilterModel MUST have one and only one of the following fields: single, multi, search
 * If a model has more than one, then the first available will be selected; if none are provided, no panel will render
 */
export interface FilterModel {
    id: string;
    title: string;

    single?: SingleSelectPanel;
    multi?: MultiSelectPanel;
    search?: SearchInputPanel;
    date?: DateInputPanel;
}

/**
 * Returned by the filter group whenever a selection changes. Uses the ID from the FilterModel, and a list of the active values
 */
export interface ActiveFilter {
    filterId: string;
    values: string[];
}
/**
 * Determines if two list of filters are similar
 * @param fmOne List of Filter 1
 * @param fmTwo List of Filter 2
 * @returns boolean indicating whether the list of filters are equal
 */
export function FILTER_MODEL_LIST_EQUAL(fmListOne: FilterModel[], fmListTwo: FilterModel[]): boolean {
    if (!fmListOne && !fmListTwo) {
        return true;
    }
    if (!fmListOne || !fmListTwo) {
        return false;
    }
    if (fmListOne.length !== fmListTwo.length) {
        return false;
    }

    return fmListOne.reduce((accumulator, fmFilterOne) => {
        const fmFilterTwo: FilterModel = fmListTwo.find((filterModel) => filterModel.id === fmFilterOne.id);
        if (!fmFilterTwo) {
            return false;
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return accumulator && FILTER_MODEL_EQUAL(fmFilterOne, fmFilterTwo);
    }, true);
}

/**
 * Determines if two filter objects are similar - if they have the same keys
 * and if the values at each key are equal (or similar - in case of arrays/objects)
 * @param fmOne filter object 1
 * @param fmTwo filter object 2
 * @returns boolean indicating whether the objects are similar
 */
// eslint-disable-next-line complexity
export function FILTER_MODEL_EQUAL(fmOne: FilterModel, fmTwo: FilterModel): boolean {
    if (!fmOne && !fmTwo) {
        return true;
    }
    if (!fmOne || !fmTwo) {
        return false;
    }

    if ("single" in fmOne) {
        if (!("single" in fmTwo) || fmOne.single.default !== fmTwo.single.default) {
            return false;
        }

        // compare options
        if (fmOne.single.options.length !== fmTwo.single.options.length) {
            return false;
        }
        return fmOne.single.options.reduce((accumulator, fmOneOption) => {
            const fmTwoOption: FilterOption = fmTwo.single.options.find((option) => option.value === fmOneOption.value);
            if (!fmTwoOption) {
                return accumulator || false;
            }
            // compare the option
            return (
                fmOneOption.label === fmTwoOption.label &&
                fmOneOption.value === fmTwoOption.value &&
                fmOneOption.selected === fmTwoOption.selected
            );
        }, false);
    }
    if ("multi" in fmOne) {
        if (!("multi" in fmTwo) || fmOne.multi.isChip !== fmTwo.multi.isChip) {
            return false;
        }

        // compare options
        if (fmOne.multi.options.length !== fmTwo.multi.options.length) {
            return false;
        }
        return fmOne.multi.options.reduce((accumulator, fmOneOption) => {
            const fmTwoOption: FilterOption = fmTwo.multi.options.find((option) => option.value === fmOneOption.value);
            if (!fmTwoOption) {
                return accumulator || false;
            }
            // compare the option
            return (
                fmOneOption.label === fmTwoOption.label &&
                fmOneOption.value === fmTwoOption.value &&
                fmOneOption.selected === fmTwoOption.selected
            );
        }, false);
    }
    if ("search" in fmOne) {
        if (
            !("search" in fmTwo) ||
            fmOne.search.value !== fmTwo.search.value ||
            fmOne.search.hint !== fmTwo.search.hint ||
            fmOne.search.validator !== fmTwo.search.validator
        ) {
            return false;
        }
        return true;
    }
    if ("date" in fmOne) {
        if (!("date" in fmTwo)) {
            return false;
        }
        if (!fmOne.date && !fmTwo.date) {
            return true;
        }
        if (fmOne.date && fmTwo.date) {
            if (fmOne.date.specific !== fmTwo.date.specific) {
                return false;
            }
            if (!!fmOne.date.range !== !!fmTwo.date.range) {
                return false;
            }
            if (
                fmOne.date.range &&
                fmTwo.date.range &&
                (fmOne.date.range.start !== fmTwo.date.range.start || fmOne.date.range.end !== fmTwo.date.range.end)
            ) {
                return false;
            }
        }
    }
    return false;
}

/**
 * Determines the type of a filter by the keys in a filter object
 * @param filterModel FilterModel object
 * @returns filter type
 */
export function FILTER_MODEL_TYPE(filterModel: FilterModel): FilterType | undefined {
    if ("single" in filterModel) {
        return "SINGLE";
    }
    if ("multi" in filterModel) {
        return filterModel.multi.isChip ? "CHIP" : "MULTI";
    }
    if ("search" in filterModel) {
        return "SEARCH";
    }
    if ("date" in filterModel) {
        return "DATE";
    }
    return undefined;
}

/**
 * Returns whether a filter is active (i.e., whether there is some value selected)
 * @param filterModel FilterModel object
 * @returns boolean that indicates if the filter is active
 */
export function IS_FILTER_ACTIVE(filterModel: FilterModel): boolean {
    switch (FILTER_MODEL_TYPE(filterModel)) {
        // Single selection filters always are selected
        case "SINGLE":
            return true;
        case "MULTI":
        case "CHIP":
            return filterModel.multi.options.filter((option) => option.selected).length > 0;
        case "SEARCH":
            return filterModel.search.value !== undefined && filterModel.search.value !== "";
        case "DATE":
            return !!(
                filterModel.date &&
                (filterModel.date.specific || (filterModel.date.range && (filterModel.date.range.start || filterModel.date.range.end)))
            );
        default:
            return false;
    }
}

/**
 * Returns an array of strings that represents the value of a filter
 * @param filterModel FilterModel object
 * @returns filter value
 */
export function GET_FILTER_MODEL_VALUES(filterModel: FilterModel): string[] {
    switch (FILTER_MODEL_TYPE(filterModel)) {
        case "SINGLE": {
            const selectedValue: FilterOption = filterModel.single.options.find((option) => option.selected);
            return selectedValue != null ? [selectedValue.value] : [filterModel.single.default];
        }
        case "MULTI":
        case "CHIP":
            return filterModel.multi.options.filter((option) => option.selected).map((option) => option.value);
        case "SEARCH":
            return [filterModel.search.value];
        case "DATE":
            return [
                (filterModel.date && filterModel.date.specific) || "",
                (filterModel.date && filterModel.date.range && filterModel.date.range.start) || "",
                (filterModel.date && filterModel.date.range && filterModel.date.range.end) || "",
            ];
        default:
            return [];
    }
}

/**
 * Returns a label for a filter
 * @param filterModel current state of the filter
 * @param language (optional) language strings (if any) to be used in the filter
 * @returns filter label
 */
export function GET_FILTER_MODEL_VALUE_LABEL(filterModel: FilterModel, language?: Record<string, string>): string {
    switch (FILTER_MODEL_TYPE(filterModel)) {
        case "SINGLE": {
            const selectedValue: FilterOption = filterModel.single.options.find((option) => option.selected);
            return selectedValue != null ? selectedValue.label : filterModel.single.default;
        }
        case "MULTI":
        case "CHIP": {
            const selectedValues: string[] = filterModel.multi.options.filter((option) => option.selected).map((option) => option.label);
            return selectedValues.length > 0
                ? selectedValues.reduce((accumulator, value) => accumulator + ", " + value, "").substring(2)
                : "";
        }
        case "SEARCH":
            return filterModel.search.value;
        case "DATE":
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return GET_DATE_FILTER_LABEL(filterModel.date, language);
        default:
            return "";
    }
}

export function CLONE_FILTER_MODEL(filterModel: FilterModel): FilterModel {
    return JSON.parse(JSON.stringify(filterModel));
}

/**
 * Returns a label for the date filter
 * @param date current state of the date filter
 * @param language language strings to be used
 * @returns date filter label
 */
export function GET_DATE_FILTER_LABEL(date: DateInputPanel, language: Record<string, string>): string {
    if (date.specific) {
        return date.specific;
    }
    if (date.range) {
        if (date.range.start && date.range.end) {
            return `${date.range.start} - ${date.range.end}`;
        }
        if (date.range.start && !date.range.end) {
            return `${language["primary.portal.globalComponent.filter.date.onOrAfter"]} ${date.range.start}`;
        }
        if (!date.range.start && date.range.end) {
            return `${language["primary.portal.globalComponent.filter.date.onOrBefore"]} ${date.range.end}`;
        }
    }
    return "";
}
