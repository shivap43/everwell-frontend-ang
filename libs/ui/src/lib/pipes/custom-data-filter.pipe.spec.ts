import { DateService } from "@empowered/date";
import { DataFilter } from "./custom-data-filter.pipe";

describe("DataFilter", () => {
    let pipe: DataFilter;
    let service: DateService;

    beforeEach(() => {
        pipe = new DataFilter(service);
        service = new DateService();
    });

    it("should create an instance of the pipe", () => {
        expect(pipe).toBeTruthy();
    });

    describe("getPropFlagStatusCount", () => {
        it("should return false on empty array", () => {
            expect(pipe.getPropFlagStatusCount([])).toBeFalsy();
        });
        it("shouuld return true on non-empty array", () => {
            expect(pipe.getPropFlagStatusCount(["value"])).toBeTruthy();
        });

        it("should return false on falsy, non-array value", () => {
            expect(pipe.getPropFlagStatusCount("")).toBeFalsy();
        });

        it("should return true on truthy, non-array value", () => {
            expect(pipe.getPropFlagStatusCount("value")).toBeTruthy();
        });
    });

    describe("dateSubmittedSearch", () => {
        it("should return true if dateSubmitted has 2 dates and dateObj[ownProp] falls within the range they define", () => {
            expect(
                pipe.dateSubmittedSearch({ date: "2022-12-09" }, { effectiveStarting: "2022-12-01", expiresAfter: "2023-12-10" }, "date"),
            ).toBe(true);
        });

        it("should return false if dateSubmitted has 2 dates and dateObj[ownProp] falls outside the range they define", () => {
            expect(
                pipe.dateSubmittedSearch({ date: "2022-12-28" }, { effectiveStarting: "2022-12-01", expiresAfter: "2023-12-10" }, "date"),
            ).toBe(true);
        });

        it("should return true if dateObj[ownProp] is after startDate", () => {
            expect(pipe.dateSubmittedSearch({ date: "2022-12-09" }, { startDate: "2022-12-01" }, "date")).toBe(true);
        });

        it("should return true if dateObj[ownProp] is before endDate", () => {
            expect(pipe.dateSubmittedSearch({ date: "2022-12-09" }, { endDate: "2022-12-10" }, "date")).toBe(true);
        });

        it("should return false if dateSubmitted does not have startDate and endDate props", () => {
            expect(pipe.dateSubmittedSearch({ date: "2022-12-09" }, { effectiveStarting: "2022-12-01" }, "date")).toBe(false);
        });
    });

    describe("freeTextSearch", () => {
        it("should return true if for some key dataObj[key] is a substring of freeText[key]", () => {
            expect(pipe.freeTextSearch({ id: "1223" }, { id: "12" })).toBe(true);
        });

        it("should return false if for any key dataObj[key] is not a substring of freeText[key]", () => {
            expect(pipe.freeTextSearch({ id: "1223" }, { id: "1234" })).toBe(false);
        });

        it("should return true if some string type properties in dataObj and freeText match (case ignored)", () => {
            expect(pipe.freeTextSearch({ name: "devus" }, { name: "DEVUS" })).toBe(true);
        });

        it("should return false if no string type property in dataObj and freeText match (case ignored)", () => {
            expect(pipe.freeTextSearch({ name: "Email", value: "EMAIL" }, { name: "Phone", value: "PHONE" })).toBe(false);
        });

        it("should return true if element in an array type value matches freeText", () => {
            expect(pipe.freeTextSearch({ id: ["1223", "1224", "1225"] }, { id: "1223" })).toBe(true);
        });
    });

    describe("isEmptyObjectValues", () => {
        it("should return true if object has no keys", () => {
            expect(pipe.isEmptyObjectValues({})).toBe(true);
        });

        it("should return true if object only has falsy properties like 0", () => {
            expect(pipe.isEmptyObjectValues({ id: 0 })).toBe(true);
        });

        it("should return true if object has only falsy properties like ''", () => {
            expect(pipe.isEmptyObjectValues({ id: 0, name: "" })).toBe(true);
        });

        it("should consider empty arrays as falsy", () => {
            expect(pipe.isEmptyObjectValues({ id: 0, plans: [] })).toBe(true);
        });

        it("should run all checks recursively", () => {
            expect(pipe.isEmptyObjectValues({ id: 0, plans: { ids: [] } })).toBe(true);
        });
    });
});
