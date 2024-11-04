import { TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { EnrollmentRequirementsService } from "../enrollment-requirements/enrollment-requirements.service";

import { RiderStateService } from "../rider-state/rider-state.service";
import { RiderState } from "./rider-state.model";

// Mock LanguageService converts tagName to the expected language string (just the tagName)
const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages, tagName) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages, tagName) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

describe("RiderStateService", () => {
    let service: RiderStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                RiderStateService,
                EnrollmentRequirementsService,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
        });

        service = TestBed.inject(RiderStateService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("getRiderStateByRiderPlanId()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should return null if planId is falsy", () => {
            const riderStates = [
                {},
                {
                    riderPlanId: undefined,
                },
                { riderPlanId: null },
                { riderPlanId: 0 },
            ] as RiderState[];

            const result = service.getRiderStateByRiderPlanId(riderStates, null, null, false);

            expect(result).toBeNull();
        });

        it("should return null if no RiderState with planId is found", () => {
            const riderStates = [
                {
                    riderPlanId: 222,
                },
            ] as RiderState[];

            const result = service.getRiderStateByRiderPlanId(riderStates, 333, 10, false);

            expect(result).toBeNull();
        });

        it("should return validated RiderState with expected planId", () => {
            const riderStates = [
                {
                    riderPlanId: 222,
                },
            ] as RiderState[];

            const result = service.getRiderStateByRiderPlanId(riderStates, 222, 10, false);

            expect(result).toStrictEqual({
                riderPlanId: 222,
            });
        });
        it("should return validated RiderState with expected planId and riderPlanId if it is supplementaryPlan", () => {
            const riderStates = [
                {
                    riderPlanId: 222,
                    planId: 20,
                },
                {
                    riderPlanId: 222,
                    planId: 10,
                },
            ] as RiderState[];

            const result = service.getRiderStateByRiderPlanId(riderStates, 222, 10, true);

            expect(result).toStrictEqual({
                riderPlanId: 222,
                planId: 10,
            });
        });
    });

    describe("riderStateHasSomeRiderPlanId()", () => {
        it("should return true if a RiderState has matching riderPlanId", () => {
            const riderState = {
                riderPlanId: 333,
            } as RiderState;

            const result = service.riderStateHasSomeRiderPlanId(riderState, [111, 222, 333, 444, 555]);
            expect(result).toBe(true);
        });

        it("should return false if a RiderState has NO matching riderPlanId", () => {
            const riderState = {
                riderPlanId: 333,
            } as RiderState;

            const result = service.riderStateHasSomeRiderPlanId(riderState, [111, 222, 444, 555]);
            expect(result).toBe(false);
        });
    });
});
