import { TestBed } from "@angular/core/testing";
import { MemberDependent } from "@empowered/constants";

import { AgeService } from "./age.service";

describe("AgeService", () => {
    let service: AgeService;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AgeService],
        });

        service = TestBed.inject(AgeService);
    });

    beforeAll(() => {
        // Test involves current date, so we should mock the current date
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2000-09-15"));
    });
    afterAll(() => {
        jest.useRealTimers();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("getAge", () => {
        it("should get the number of years from starting date to current time", () => {
            const result = service.getAge("1990-09-01");

            expect(result).toBe(10);
        });
    });

    describe("getMemberDependentAges", () => {
        it("should get the number of years from starting date to current time for all memberDependent", () => {
            const result = service.getMemberDependentAges([
                { name: "some dependent", state: "Arizona", birthDate: "1995-09-14", gender: "FEMALE" } as MemberDependent,
                { name: "some dependent", state: "Arizona", birthDate: "1995-09-16", gender: "FEMALE" } as MemberDependent,
                { name: "some dependent", state: "Arizona", birthDate: "1995-09-17", gender: "FEMALE" } as MemberDependent,
            ]);
            // original value is [5, 5, 4], but because of sort it become [4, 5, 5].
            expect(result).toStrictEqual([4, 4, 5]);
        });
    });

    describe("getMemberDependentAge", () => {
        it("should get 0 if there isn't a MemberDependent or MemberDependent doesn't have a birthDate", () => {
            expect(service.getMemberDependentAge({} as MemberDependent)).toBe(0);
            expect(service.getMemberDependentAge(null)).toBe(0);
        });

        it("should get the number of years from starting date to current time for selected memberDependent", () => {
            // console.log(Date.now());
            const result = service.getMemberDependentAge({
                name: "some dependent",
                state: "Arizona",
                birthDate: "1995-09-14",
                gender: "FEMALE",
            } as MemberDependent);

            expect(result).toBe(5);
        });
    });
});
