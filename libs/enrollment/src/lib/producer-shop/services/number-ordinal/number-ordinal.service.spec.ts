import { TestBed } from "@angular/core/testing";

import { NumberOrdinalService } from "./number-ordinal.service";

describe("NumberOrdinalService", () => {
    let service: NumberOrdinalService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NumberOrdinalService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getNumberWithOrdinal()", () => {
        describe("converting numbers to strings with ordinals", () => {
            it("should convert 0 to 0th", () => {
                expect(service.getNumberWithOrdinal(0)).toBe("0th");
            });

            it("should convert 1 to 1st", () => {
                expect(service.getNumberWithOrdinal(1)).toBe("1st");
            });

            it("should convert 2 to 2nd", () => {
                expect(service.getNumberWithOrdinal(2)).toBe("2nd");
            });

            it("should convert 3 to 3rd", () => {
                expect(service.getNumberWithOrdinal(3)).toBe("3rd");
            });

            it("should convert 4 to 4th", () => {
                expect(service.getNumberWithOrdinal(4)).toBe("4th");
            });

            it("should convert 10 to 10th", () => {
                expect(service.getNumberWithOrdinal(10)).toBe("10th");
            });

            it("should convert 11 to 11th", () => {
                expect(service.getNumberWithOrdinal(11)).toBe("11th");
            });

            it("should convert 12 to 12th", () => {
                expect(service.getNumberWithOrdinal(12)).toBe("12th");
            });

            it("should convert 13 to 13th", () => {
                expect(service.getNumberWithOrdinal(13)).toBe("13th");
            });

            it("should convert 14 to 14th", () => {
                expect(service.getNumberWithOrdinal(14)).toBe("14th");
            });

            it("should convert 20 to 20th", () => {
                expect(service.getNumberWithOrdinal(20)).toBe("20th");
            });

            it("should convert 21 to 21st", () => {
                expect(service.getNumberWithOrdinal(21)).toBe("21st");
            });

            it("should convert 22 to 22nd", () => {
                expect(service.getNumberWithOrdinal(22)).toBe("22nd");
            });
        });
    });
});
