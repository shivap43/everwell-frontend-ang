import { TestBed } from "@angular/core/testing";
import { DatesService } from "./dates.service";

describe("DatesService", () => {
    let service: DatesService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DatesService],
        });

        service = TestBed.inject(DatesService);
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("getEarliestDate()", () => {
        it("should return null if all dates are nullish in possibleDates", () => {
            const possibleDates: (string | null)[] = [null, null, null, null];

            expect(service.getEarliestDate(possibleDates)).toBeNull();
        });

        it("should return the earliest date string found from planOfferingWithCoverageDates", () => {
            const possibleDates: (string | null)[] = ["2020-01-20", "2000-01-20", "1800-01-20", "1990-01-20"];

            expect(service.getEarliestDate(possibleDates)).toBe("1800-01-20");
        });
    });

    describe("dateIsBetweenRange()", () => {
        it("should return true if there is no range", () => {
            expect(service.dateIsBetweenRange("1990-09-09", null, null)).toBe(true);
        });

        it("should return true if no latest date and is after earliest date", () => {
            expect(service.dateIsBetweenRange("1990-09-09", "1900-01-15", null)).toBe(true);
        });

        it("should return false if no latest date and is after earliest date", () => {
            expect(service.dateIsBetweenRange("1990-09-09", "2000-01-15", null)).toBe(false);
        });

        it("should return true if no earliest date and is before latest date", () => {
            expect(service.dateIsBetweenRange("1990-09-09", null, "2020-06-12")).toBe(true);
        });

        it("should return false if no earliest date and is after latest date", () => {
            expect(service.dateIsBetweenRange("1990-09-09", null, "1990-06-12")).toBe(false);
        });

        it("should return true if between range", () => {
            expect(service.dateIsBetweenRange("1990-09-09", "1900-01-15", "2020-06-12")).toBe(true);
        });

        it("should return false if given date is before range", () => {
            expect(service.dateIsBetweenRange("1990-09-09", "2000-03-11", "2020-06-12")).toBe(false);
        });

        it("should return false if given date is after range", () => {
            expect(service.dateIsBetweenRange("1990-09-09", "1900-01-15", "1990-06-12")).toBe(false);
        });
    });

    describe("isPastDate()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2000/09/15"));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it("should return true if date is before current date", () => {
            // Test involves current date, so we should mock the current date
            jest.spyOn(Date, "now").mockReturnValue(new Date("2000/09/15").valueOf());

            expect(service.isPastDate("2000-09-14")).toBe(true);
        });
    });

    describe("getDifferenceInDays()", () => {
        it("should return negative 4 days difference", () => {
            expect(service.getDifferenceInDays(new Date("2023/01/01"), new Date("2023/01/05"))).toBe(-4);
        });
        it("should return positive 3 days difference", () => {
            expect(service.getDifferenceInDays(new Date("2023/01/04"), new Date("2023/01/01"))).toBe(3);
        });
    });

    describe("isAfterOrEqual()", () => {
        it("should return true if dateLeft is after dateRight", () => {
            expect(service.isAfterOrEqual(new Date("2000/01/02"), new Date("2000/01/01"))).toBe(true);
        });
        it("should return true if both dates are equal", () => {
            const date = new Date();
            expect(service.isAfterOrEqual(date, date)).toBe(true);
        });

        it("should return false if dateLeft is in the past", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 1);
            expect(service.isAfterOrEqual(date, new Date())).toBe(false);
        });
    });

    describe("isBeforeOrEqual()", () => {
        it("should return true if date is before dateRight", () => {
            expect(service.isBeforeOrEqual(new Date("2000/01/01"), new Date("2000/01/02"))).toBe(true);
        });
        it("should return true if both dates are equal", () => {
            const date = new Date();
            expect(service.isBeforeOrEqual(date, date)).toBe(true);
        });

        it("should return false if dateLeft is in the future", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expect(service.isBeforeOrEqual(date, new Date())).toBe(false);
        });
    });

    describe("isAfter()", () => {
        it("should return true if dateLeft is after dateRight", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expect(service.isAfter(date, new Date())).toBe(true);
        });

        it("should return false if dateLeft is before dateRight", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 1);
            expect(service.isAfter(date, new Date())).toBe(false);
        });
    });

    describe("isBefore()", () => {
        it("should return true if dateLeft is before dateRight", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 1);
            expect(service.isBefore(date, new Date())).toBe(true);
        });

        it("should return false if dateLeft is after dateRight", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expect(service.isBefore(date, new Date())).toBe(false);
        });
    });

    describe("isEqual()", () => {
        it("should return true if dates are equal", () => {
            const date = new Date();
            expect(service.isEqual(date, date)).toBe(true);
        });
        it("should return false if dates are not equal", () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expect(service.isEqual(date, new Date())).toBe(false);
        });
    });

    describe("toDateObj()", () => {
        let date: Date;
        beforeAll(() => {
            date = new Date("2022/01/01");
            jest.useFakeTimers();
            jest.setSystemTime(date);
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should return current time when passing undefined parameter", () => {
            // when passing undefined into moment's constructor, it returned current time
            expect(service.toDateObj()).toStrictEqual(date);
        });
        it("should return invalid date object when passing invalid date object", () => {
            expect(isNaN(service.toDateObj(new Date("")).getTime())).toBe(true);
        });
        it("should return date in the current timezone when passing hyphenated date strings", () => {
            expect(service.toDateObj("2022-01-01").getTime()).toBe(date.getTime());
        });
    });
});
