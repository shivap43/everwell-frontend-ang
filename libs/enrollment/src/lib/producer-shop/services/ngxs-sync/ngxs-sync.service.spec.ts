import { TestBed } from "@angular/core/testing";
import { EnrollmentMethodModel } from "@empowered/ngxs-store";
import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

import { NGRXEnrollmentStateService } from "./ngrx-enrollment-state/ngrx-enrollment-state.service";
import { NGRXEnrollmentState } from "./ngrx-sync.model";
import { NGXSEnrollmentStateService } from "./ngxs-enrollment-state/ngxs-enrollment-state.service";
import { MOCK_NGRX_ENROLLMENT_STATE, MOCK_NGXS_ENROLLMENT_STATE } from "./ngxs-sync.mock";
import { NGXSSyncService } from "./ngxs-sync.service";

/**
 * Compare two objects to see if any of their properties have different values.
 * This comparison isn't as specific to NGRX/NGXS Enrollment State checks.
 *
 * For example, NGRX Enrollment State has an instance for its CountryState.
 * This function wouldn't compare this property correct
 *
 * For the sack of simplicity the following tests in this spec should only compare properties with primitive values:
 * EnrollmentMethod, City, etc
 *
 * @param a {{[prop: string]: unknown}}
 * @param b {{[prop: string]: unknown}}
 * @returns {boolean} true if both object properties have the same values
 */
const mockComparisonUtility = <T = { [prop: string]: unknown }>(a: T, b: T) => {
    for (const prop in a) {
        if (a[prop] !== b[prop]) {
            return false;
        }
    }

    for (const prop in b) {
        if (a[prop] !== b[prop]) {
            return false;
        }
    }

    return true;
};

const mockNGRXEnrollmentState$ = new BehaviorSubject<NGRXEnrollmentState>(MOCK_NGRX_ENROLLMENT_STATE);
const mockNGRXEnrollmentStateService = {
    getLatestState: () =>
        mockNGRXEnrollmentState$
            .asObservable()
            // Only emit when any property has changed
            .pipe(distinctUntilChanged(mockComparisonUtility)),
    // To use setState in test, you will have to mock it with a jest jest: `jest.spyOn`
    setState: () => {},
} as NGRXEnrollmentStateService;

const mockNGXSEnrollmentState$ = new BehaviorSubject<EnrollmentMethodModel>(MOCK_NGXS_ENROLLMENT_STATE);
const mockNGXSEnrollmentStateService = {
    getLatestState: () =>
        mockNGXSEnrollmentState$
            .asObservable()
            // Only emit when any property has changed
            .pipe(distinctUntilChanged(mockComparisonUtility)),
    getStateSnapshot: () => mockNGXSEnrollmentState$.getValue(),
    // To use setState in test, you will have to mock it with a jest jest: `jest.spyOn`
    setState: () => {},
} as NGXSEnrollmentStateService;

describe("NGXSSyncService", () => {
    let service: NGXSSyncService;
    let ngrxEnrollmentStateService: NGRXEnrollmentStateService;
    let ngxsEnrollmentStateService: NGXSEnrollmentStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NGXSSyncService,
                { provide: NGXSEnrollmentStateService, useValue: mockNGXSEnrollmentStateService },
                { provide: NGRXEnrollmentStateService, useValue: mockNGRXEnrollmentStateService },
            ],
            imports: [],
        });

        service = TestBed.inject(NGXSSyncService);
        ngrxEnrollmentStateService = TestBed.inject(NGRXEnrollmentStateService);
        ngxsEnrollmentStateService = TestBed.inject(NGXSEnrollmentStateService);
    });

    beforeEach(() => {
        jest.restoreAllMocks();

        // Reset states to original values between tests
        mockNGRXEnrollmentState$.next(MOCK_NGRX_ENROLLMENT_STATE);
        mockNGXSEnrollmentState$.next(MOCK_NGXS_ENROLLMENT_STATE);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should default NGRX Enrollment State when initialized", () => {
        const spy = jest.spyOn(mockNGRXEnrollmentStateService, "setState");
        new NGXSSyncService(mockNGRXEnrollmentStateService, mockNGXSEnrollmentStateService);
        expect(spy).toBeCalledWith(MOCK_NGXS_ENROLLMENT_STATE);
    });

    describe("defaultNGRXEnrollmentState()", () => {
        it("should get NGXS Enrollment State snapshot and set NGRX Enrollment State", () => {
            const spy = jest.spyOn(ngxsEnrollmentStateService, "getStateSnapshot");
            const spy2 = jest.spyOn(ngrxEnrollmentStateService, "setState");

            service.defaultNGRXEnrollmentState();

            expect(spy).toBeCalled();
            expect(spy2).toBeCalledWith(MOCK_NGXS_ENROLLMENT_STATE);
        });
    });

    describe("syncFromNGRXEnrollmentState()", () => {
        it("should use NGRX Enrollment State changes to update NGXS Enrollment State", (done) => {
            expect.assertions(3);

            const spy = jest
                .spyOn(ngxsEnrollmentStateService, "setState")
                .mockImplementation((ngrxEnrollmentState: NGRXEnrollmentState) => {
                    mockNGXSEnrollmentState$.next({
                        ...MOCK_NGXS_ENROLLMENT_STATE,
                        enrollmentCity: ngrxEnrollmentState.selectedCity,
                    });
                });

            // Track how many emits there are
            // Test expects 3
            let syncs = 0;

            service.syncFromNGRXEnrollmentState().subscribe(() => {
                syncs++;

                if (syncs === 3) {
                    // First emit should be done when subscription is made
                    expect(spy).toHaveBeenNthCalledWith(1, MOCK_NGRX_ENROLLMENT_STATE, MOCK_NGXS_ENROLLMENT_STATE);
                    expect(spy).toHaveBeenNthCalledWith(
                        2,
                        { ...MOCK_NGRX_ENROLLMENT_STATE, selectedCity: "New City" },
                        MOCK_NGXS_ENROLLMENT_STATE,
                    );
                    expect(spy).toHaveBeenNthCalledWith(
                        3,
                        { ...MOCK_NGRX_ENROLLMENT_STATE, selectedCity: "Another City" },
                        { ...MOCK_NGXS_ENROLLMENT_STATE, enrollmentCity: "New City" },
                    );

                    done();
                }
            });

            // Once to update NGXS Enrollment State
            mockNGRXEnrollmentState$.next({ ...MOCK_NGRX_ENROLLMENT_STATE, selectedCity: "New City" });
            // Twice to confirm previous update was made
            mockNGRXEnrollmentState$.next({ ...MOCK_NGRX_ENROLLMENT_STATE, selectedCity: "Another City" });
        });
    });

    describe("syncFromNGXSEnrollmentState()", () => {
        it("should use NGXS Enrollment State changes to update NGRX Enrollment State", (done) => {
            expect.assertions(3);

            const spy = jest
                .spyOn(ngrxEnrollmentStateService, "setState")
                .mockImplementation((ngxsEnrollmentState: EnrollmentMethodModel) => {
                    mockNGRXEnrollmentState$.next({
                        ...MOCK_NGRX_ENROLLMENT_STATE,
                        selectedCity: ngxsEnrollmentState.enrollmentCity,
                    });
                });

            // Track how many emits there are
            // Test expects 3
            let syncs = 0;

            service.syncFromNGXSEnrollmentState().subscribe(() => {
                syncs++;

                if (syncs === 3) {
                    // First emit should be done when subscription is made
                    expect(spy).toHaveBeenNthCalledWith(1, MOCK_NGXS_ENROLLMENT_STATE, MOCK_NGRX_ENROLLMENT_STATE);
                    expect(spy).toHaveBeenNthCalledWith(
                        2,
                        { ...MOCK_NGXS_ENROLLMENT_STATE, enrollmentCity: "New City" },
                        MOCK_NGRX_ENROLLMENT_STATE,
                    );
                    expect(spy).toHaveBeenNthCalledWith(
                        3,
                        { ...MOCK_NGXS_ENROLLMENT_STATE, enrollmentCity: "Another City" },
                        { ...MOCK_NGRX_ENROLLMENT_STATE, selectedCity: "New City" },
                    );

                    done();
                }
            });

            // Once to update NGRX Enrollment State
            mockNGXSEnrollmentState$.next({ ...MOCK_NGXS_ENROLLMENT_STATE, enrollmentCity: "New City" });
            // Twice to confirm previous update was made
            mockNGXSEnrollmentState$.next({ ...MOCK_NGXS_ENROLLMENT_STATE, enrollmentCity: "Another City" });
        });
    });

    describe("syncEnrollmentStates()", () => {
        it("should listen to any changes made and sync both Enrollment States", (done) => {
            expect.assertions(1);

            jest.spyOn(ngxsEnrollmentStateService, "setState").mockImplementation((ngrxEnrollmentState: NGRXEnrollmentState) => {
                mockNGXSEnrollmentState$.next({
                    ...MOCK_NGXS_ENROLLMENT_STATE,
                    enrollmentCity: ngrxEnrollmentState.selectedCity,
                });
            });

            jest.spyOn(ngrxEnrollmentStateService, "setState").mockImplementation((ngxsEnrollmentState: EnrollmentMethodModel) => {
                mockNGRXEnrollmentState$.next({
                    ...MOCK_NGRX_ENROLLMENT_STATE,
                    selectedCity: ngxsEnrollmentState.enrollmentCity,
                });
            });

            const states = [];

            service.syncEnrollmentStates().subscribe(() => {
                states.push([mockNGXSEnrollmentState$.getValue(), mockNGRXEnrollmentState$.getValue()]);

                if (states.length === 6) {
                    // The following expectation should show two sets of Enrollment States per change
                    // Once for one trying to update the other,
                    // And again since the other was updated
                    // This shouldn't trigger the first Enrollment State to update again though
                    expect(states).toStrictEqual([
                        // Initial state for NGXS Enrollment State
                        [MOCK_NGXS_ENROLLMENT_STATE, MOCK_NGRX_ENROLLMENT_STATE],
                        // Initial state for NGRX Enrollment State
                        [MOCK_NGXS_ENROLLMENT_STATE, MOCK_NGRX_ENROLLMENT_STATE],
                        // Update from NGXS Enrollment State
                        [
                            {
                                ...MOCK_NGXS_ENROLLMENT_STATE,
                                enrollmentCity: "NGXS City",
                            },
                            {
                                ...MOCK_NGRX_ENROLLMENT_STATE,
                                selectedCity: "NGXS City",
                            },
                        ],
                        // NGRX Enrollment State relaying that it got the change
                        [
                            {
                                ...MOCK_NGXS_ENROLLMENT_STATE,
                                enrollmentCity: "NGXS City",
                            },
                            {
                                ...MOCK_NGRX_ENROLLMENT_STATE,
                                selectedCity: "NGXS City",
                            },
                        ],
                        // Note that the NGXS Enrollment State doesn't update again from the "NGXS City"
                        // This is expected since it already should have this value for `enrollmentCity`

                        // Update from NGRX Enrollment State
                        [
                            {
                                ...MOCK_NGXS_ENROLLMENT_STATE,
                                enrollmentCity: "NGRX City",
                            },
                            {
                                ...MOCK_NGRX_ENROLLMENT_STATE,
                                selectedCity: "NGRX City",
                            },
                        ],
                        // NGXS Enrollment State relaying that it got the change
                        [
                            {
                                ...MOCK_NGXS_ENROLLMENT_STATE,
                                enrollmentCity: "NGRX City",
                            },
                            {
                                ...MOCK_NGRX_ENROLLMENT_STATE,
                                selectedCity: "NGRX City",
                            },
                        ],
                    ]);

                    done();
                }
            });

            // Once to update NGRX Enrollment State using NGXS Enrollment State
            mockNGXSEnrollmentState$.next({ ...MOCK_NGXS_ENROLLMENT_STATE, enrollmentCity: "NGXS City" });

            // Once to update NGXS Enrollment State using NGRX Enrollment State
            mockNGRXEnrollmentState$.next({ ...MOCK_NGRX_ENROLLMENT_STATE, selectedCity: "NGRX City" });
        });
    });
});
