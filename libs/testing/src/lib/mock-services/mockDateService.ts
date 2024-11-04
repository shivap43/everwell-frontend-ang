export const mockDateService = {
    getIsAfterOrIsEqual: (dateLeft: Date | number, dateRight: Date | number) => true,
    isBeforeOrIsEqual: (dateLeft: Date | number, dateRight: Date | number) => true,
    format: (date: Date | number | string, dateFormat: string) => date,
    checkIsAfter: (date: Date | number | string) => true,
    isBefore: (dateToCompare: Date | number | string, dateToCompareAgainst?: Date | string) => true,
    toDate: (date?: string | Date | number | null) => date,
    getDifferenceInYears: (date: Date | number | string, fromDate?: Date | number | string) => 1,
};
