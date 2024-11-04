import { TestBed } from "@angular/core/testing";
import { parseISO, addDays, subDays, subYears } from "date-fns";

import { DateService } from "./date.service";
import { DateFormats } from "@empowered/constants";

describe("DateService", () => {
    let service: DateService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DateService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getYearsFromNow()", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(parseISO("1995-03-07").valueOf());
        });
        it("should return the difference in time from now to date in years", () => {
            expect(service.getYearsFromNow(parseISO("1985-04-13"))).toBe(9);
            expect(service.getYearsFromNow(parseISO("1985-04-13")).valueOf()).toBe(9);
        });
        afterAll(() => {
            jest.useRealTimers();
        });
    });

    describe("differenceInDays()", () => {
        it("should return difference between two provided dates in number of days", () => {
            expect(service.getDifferenceInDays(parseISO("1985-04-15"), parseISO("1985-04-10"))).toBe(5);
        });
    });

    describe("isBetween()", () => {
        it("should return true if today's date is in between the given dates", () => {
            const date = new Date();
            expect(service.isBetween(date.setDate(date.getDate() - 5), date.setDate(date.getDate() + 10))).toBeTruthy();
        });

        it("should return false if today's date is not in between the given dates", () => {
            const date = new Date();
            expect(service.isBetween(date.setDate(date.getDate() + 1), date.setDate(date.getDate() + 5))).toBeFalsy();
        });

        it("should return true if dateToCompare is same as today", () => {
            const date = new Date();
            expect(service.isBetween(date, new Date().setDate(date.getDate() + 1), date)).toBe(true);
        });

        it("should return true if dateToCompare is same as endDate", () => {
            const date = new Date();
            expect(service.isBetween(new Date().setDate(date.getDate() - 1), date, date)).toBe(true);
        });
        it("should return true if dateToCompare is same as endDate and startDate", () => {
            const date = new Date();
            expect(service.isBetween(date, date, date)).toBe(true);
        });

        it("should return false if dateToCompare is before given range", () => {
            const date = new Date();
            expect(service.isBetween(date, date, new Date().setDate(date.getDate() - 1))).toBe(false);
        });

        it("should return false if dateToCompare is after given range", () => {
            const date = new Date();
            expect(service.isBetween(date, date, new Date().setDate(date.getDate() + 1))).toBe(false);
        });

        describe("Block for checking against current date", () => {
            beforeEach(() => {
                jest.useFakeTimers();
                jest.setSystemTime(new Date("2020/01/01"));
            });
            afterAll(() => {
                jest.useRealTimers();
            });
            it("should return true if today's date is same as startDate and endDate", () => {
                expect(service.isBetween(new Date(), new Date())).toBe(true);
            });
            it("should return true if startDate is before today and endDate is after today", () => {
                const today = new Date();
                expect(service.isBetween(new Date().setDate(today.getDate() - 1), new Date().setDate(today.getDate() + 1))).toBe(true);
            });
            it("should return false if startDate is after today's date", () => {
                const today = new Date();
                expect(service.isBetween(new Date().setDate(today.getDate() + 1), new Date().setDate(today.getDate() + 2))).toBe(false);
            });

            it("should return false if endDate is before today's date", () => {
                const today = new Date();
                const yesterday = new Date().setDate(today.getDate() - 1);
                expect(service.isBetween(yesterday, yesterday)).toBe(false);
            });
        });
    });

    describe("getToDate()", () => {
        it("should return the instance of the date", () => {
            const date = new Date();
            expect(service.getToDate(date)).toEqual(date);
        });
        it("convert the time stamp to date", () => {
            const timeStamp = 1607110465663;
            expect(service.getToDate(timeStamp)).toEqual(new Date(timeStamp));
        });
    });

    describe("checkIsAfter()", () => {
        it("should return true if the date passed is greater than the date that is compared to", () => {
            expect(service.checkIsAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))).toBeTruthy();
        });
        it("should return false if the date passed is less than the date that is compared to", () => {
            expect(service.checkIsAfter(new Date(1987, 6, 10), new Date(1989, 1, 11))).toBeFalsy();
        });
        it("should be true if the date passed is after today", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expect(service.checkIsAfter(date)).toBe(true);
        });
    });
    describe("getIsAfterOrIsEqual()", () => {
        it("Should return true If first date is greater than second date", () => {
            expect(service.getIsAfterOrIsEqual(parseISO("1985-04-15"), parseISO("1985-04-10"))).toBeTruthy();
        });

        it("Should return false If first date is less than second date", () => {
            expect(service.getIsAfterOrIsEqual(parseISO("2002-04-15"), parseISO("2005-04-10"))).toBeFalsy();
        });

        it("Should return true If first date is equal to second date", () => {
            expect(service.getIsAfterOrIsEqual(parseISO("2005-04-10"), parseISO("2005-04-10"))).toBeTruthy();
        });
    });
    describe("checkIsTodayOrBefore()", () => {
        it("should return true if the date is in past or is today", () => {
            expect(service.checkIsTodayOrBefore("2022-06-10")).toBe(true);
        });
        it("should return false if the date is in future", () => {
            const date = "01/06/2022".replace("2022", (new Date().getUTCFullYear() + 1).toString());
            expect(service.checkIsTodayOrBefore(date)).toBe(false);
        });
    });

    describe("checkIsTodayOrAfter()", () => {
        it("should return false if the date is in past", () => {
            expect(service.checkIsTodayOrAfter("2022-09-10")).toBe(false);
        });
        it("should return false if the date is in future", () => {
            const date = "01/06/2022".replace("2022", (new Date().getUTCFullYear() + 1).toString());
            expect(service.checkIsTodayOrAfter(date)).toBe(true);
        });
    });

    describe("isBefore()", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(parseISO("1995-03-07").valueOf());
        });
        it("should return true since the given date is in past", () => {
            expect(service.isBefore(parseISO("1985-04-13"))).toBe(true);
        });

        it("should return false since the given date is in future", () => {
            expect(service.isBefore(parseISO("1997-04-13"))).toBe(false);
        });

        it("should return false since the given date is same as today", () => {
            expect(service.isBefore(parseISO("1995-03-07"))).toBe(false);
        });
        afterAll(() => {
            jest.useRealTimers();
        });
    });

    describe("parseDate()", () => {
        it("should return the date by parsing the string date,based on the format type", () => {
            expect(service.parseDate("2022-10-12", DateFormats.YEAR_MONTH_DAY)).toStrictEqual(new Date("2022/10/12"));
        });
    });

    describe("addDays()", () => {
        it("should return date after adding days", () => {
            const date = new Date("2022-01-01");
            expect(service.addDays(date, 3)).toStrictEqual(new Date("2022-01-04"));
        });
    });

    describe("subtractDays()", () => {
        it("should return date after subtracting days", () => {
            const date = new Date("2022-01-30");
            expect(service.subtractDays(date, 3)).toStrictEqual(new Date("2022-01-27"));
        });
    });

    describe("isInPastByDays()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2014/01/01"));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return true if date is 3 days ago", () => {
            const date = new Date("2022/01/01");
            const refDate = addDays(date, 3);
            expect(service.isInPastByDays(date, 3, refDate)).toBe(true);
        });

        it("should return true if the date is 5 days ago", () => {
            const date = subDays(new Date(), 5);
            expect(service.isInPastByDays(date, 5)).toBe(true);
        });
    });

    describe("isInFutureByDays()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2014/01/01"));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return true if date is 3 days in the future", () => {
            const date = new Date("2022-01-13");
            const refDate = subDays(date, 3);
            expect(service.isInFutureByDays(date, 3, refDate)).toBe(true);
        });

        it("should return true if the date is 5 days in the future", () => {
            const date = addDays(new Date(), 5);
            expect(service.isInFutureByDays(date, 5)).toBe(true);
        });
    });

    describe("addYears()", () => {
        it("should return date after adding years", () => {
            const date = new Date("2020-12-01");
            expect(service.addYears(date, 2)).toStrictEqual(new Date("2022-12-01"));
        });
    });

    describe("addMonths()", () => {
        it("should return date after adding months", () => {
            const date = new Date("2020/12/01");
            expect(service.addMonths(date, 2)).toStrictEqual(new Date("2021/02/01"));
        });
    });
    describe("getFirstOfNextMonth()", () => {
        it("should return first date of next Month", () => {
            const date = new Date("2022/01/05");
            expect(service.getFirstOfNextMonth(date)).toStrictEqual(new Date("2022/02/01"));
        });
    });

    describe("isBeforeOrIsEqual()", () => {
        it("should return true if date is before/equal", () => {
            const date = new Date("2022-01-01");
            expect(service.isBeforeOrIsEqual(date)).toBe(true);
        });
        it("should return false if date is in future", () => {
            const date = new Date().setFullYear(new Date().getFullYear() + 1);
            expect(service.isBeforeOrIsEqual(date)).toBe(false);
        });
    });

    describe("format()", () => {
        it("should return date as Month date, year", () => {
            const date = new Date("2023/01/01");
            const formatString = "MMMM d, yyyy";
            expect(service.format(date, formatString)).toStrictEqual("January 1, 2023");
        });
    });

    describe("isEqual()", () => {
        it("should return true if dates are equal", () => {
            const date = new Date("2023-01-01");
            const date2 = new Date("2023-01-01");
            expect(service.isEqual(date, date2)).toBe(true);
        });
        it("should return false for unequal dates", () => {
            const date = new Date();
            const date2 = new Date("2023-01-01");
            expect(service.isEqual(date, date2)).toBe(false);
        });
    });

    describe("max()", () => {
        it("should return greatest of all dates", () => {
            const dates: Date[] = [new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 1))];
            expect(service.max(dates)).toStrictEqual(dates[1]);
        });
    });

    describe("isValid()", () => {
        it("should return false for invalid date", () => {
            expect(service.isValid(new Date("2244-23-31"))).toBe(false);
        });
    });

    describe("getOneDayLessThanYear()", () => {
        it("should date which is 1 day less in next year", () => {
            const date = new Date("2022-01-02");
            expect(service.getOneDayLessThanYear(date)).toEqual(new Date("2023-01-01"));
        });
    });

    describe("getFormattedFirstOfMonths()", () => {
        it("should return date of next month with proper format", () => {
            const date = new Date("2022-01-25");
            expect(service.getFormattedFirstOfMonths(date, 2, "MM-dd-yyyy")).toEqual("03-01-2022");
        });
    });

    describe("getWeekdaysName()", () => {
        it("it should return array of weekday names", () => {
            expect(service.getWeekdaysName(1)).toEqual(["Monday"]);
        });
    });

    describe("toDate()", () => {
        const currentDate = new Date("2014/01/01");
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(currentDate);
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return formatted date object when string date has hyphen", () => {
            expect(service.toDate("2022-05-01")).toEqual(new Date("2022/05/01"));
        });
        it("should return date object when string date has no hyphen", () => {
            expect(service.toDate("2022/05/01")).toEqual(new Date("2022/05/01"));
        });
        it("should return date object when number is passed", () => {
            expect(service.toDate(0)).toEqual(new Date("1970-01-01"));
        });

        it("should return the same date object when date is passed", () => {
            const date = new Date();
            expect(service.toDate(date)).toEqual(date);
        });

        it("should return current date when undefined parameter is passed", () => {
            expect(service.toDate(undefined)).toEqual(currentDate);
        });

        it("should return invalid date object when passed null values", () => {
            expect(isNaN(service.toDate(null).getTime())).toBe(true);
        });
    });

    describe("getDifferenceInYears()", () => {
        it("should return the difference of years from the provided date", () => {
            const date = new Date("2005-01-01");
            const fromDate = new Date("2010-01-01");
            expect(service.getDifferenceInYears(date, fromDate)).toBe(5);
        });
    });

    describe("getLastDayOfMonth()", () => {
        it("should return the last date of the month", () => {
            const date = new Date("2010-01-01").setUTCHours(0, 0, 0, 0);
            expect(service.getLastDayOfMonth(date)).toEqual(31);
        });
    });

    describe("min()", () => {
        it("should return the earliest date within the array", () => {
            const dates = [new Date("2022-01-01"), new Date("2020-01-01"), new Date("2021-01-01")];
            expect(service.min(dates)).toEqual(dates[1]);
        });

        it("should filter out nullish values when checking minimum out of passed date values", () => {
            const dates = [new Date("2021/01/02"), new Date("2021/01/01"), new Date("")];
            expect(service.min(dates)).toEqual(dates[1]);
        });
    });

    describe("getYearOfBirthFromToday()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2014/01/01"));
        });

        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return year of birth", () => {
            const date = subYears(new Date(), 20);
            const expectedDate = addDays(date, 1);
            expect(service.getYearOfBirthFromToday(20)).toStrictEqual(expectedDate);
        });
    });

    describe("getStartOfDay(), getEndOfDay()", () => {
        const date = new Date();
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(date);
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        describe("getStartOfDay()", () => {
            it("should return the start of day for the given date", () => {
                const dateString = "2020/01/02";
                const dateObj = new Date(dateString).setHours(20, 4, 3, 12);
                expect(service.getStartOfDay(dateObj)).toStrictEqual(new Date(dateString));
            });

            it("should return start of today, when no argument is provided", () => {
                expect(service.getStartOfDay()).toStrictEqual(new Date(date.setHours(0, 0, 0, 0)));
            });
        });

        describe("getEndOfDay()", () => {
            it("should return the end of day for the given date", () => {
                const dateObj = new Date("2020/01/02");
                expect(service.getEndOfDay(dateObj)).toStrictEqual(new Date(dateObj.setHours(23, 59, 59, 999)));
            });

            it("should return end of today, when no arguments are provided", () => {
                expect(service.getEndOfDay()).toStrictEqual(new Date(date.setHours(23, 59, 59, 999)));
            });
        });
    });

    describe("getDaysInMonth()", () => {
        it("should return 29 as it's a leap year", () => {
            expect(service.getDaysInMonth(new Date("2008/02/01"))).toBe(29);
        });
    });

    describe("getWeekNumber()", () => {
        it("should return number value of week in the year", () => {
            expect(service.getWeekNumber(new Date("2008/02/01"), false)).toBe(5);
        });
    });
});
