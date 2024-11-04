import { TestBed } from "@angular/core/testing";
import { PlanOfferingWithCartAndEnrollment, MemberDependent } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";

import { DependentAgeService } from "./dependent-age.service";

describe("DependentAgeService", () => {
    let service: DependentAgeService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NGRXStore, provideMockStore()],
        });
        service = TestBed.inject(DependentAgeService);
    });

    beforeAll(() => {
        // Test involves moment and the current date, so we should mock the current date
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2000-09-15"));
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getDefaultMemberDependentChildAge()", () => {
        it("should return default child dependent age", (done) => {
            expect.assertions(2);
            const mock = jest.spyOn(service, "getMemberDependentChildAgeResetStateValue").mockImplementationOnce(() => of(5));
            const planPanel = {
                cartItemInfo: {},
            } as PlanOfferingWithCartAndEnrollment;
            service.getDefaultMemberDependentChildAge(planPanel).subscribe((age) => {
                expect(age).toBe(5);
                expect(mock).toBeCalledTimes(1);
                done();
            });
        });
    });

    describe("getDependentChildAgeResetState()", () => {
        it("should enrolled dependent children if they exist and have length", () => {
            const enrolledDependentChildren = [{ birthDate: "1990-09-14" }] as MemberDependent[];
            const memberDependentChildren = [{ birthDate: "1999-09-14" }] as MemberDependent[];

            expect(
                service.getDependentChildAgeResetState(
                    enrolledDependentChildren,
                    memberDependentChildren,
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                ),
            ).toBe(10);
        });

        it("should use member dependent children if NO enrolled dependent children exist nor have length", () => {
            const enrolledDependentChildren = [] as MemberDependent[];
            const memberDependentChildren = [{ birthDate: "1999-09-15" }] as MemberDependent[];

            expect(
                service.getDependentChildAgeResetState(
                    enrolledDependentChildren,
                    memberDependentChildren,
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                ),
            ).toBe(1);
        });

        it("should return first age of dependent age range if no found age is within range", () => {
            const enrolledDependentChildren = [{ birthDate: "1990-09-15" }] as MemberDependent[];
            const memberDependentChildren = [{ birthDate: "1999-09-15" }] as MemberDependent[];

            expect(service.getDependentChildAgeResetState(enrolledDependentChildren, memberDependentChildren, [5, 6, 7])).toBe(5);
        });
    });
});
