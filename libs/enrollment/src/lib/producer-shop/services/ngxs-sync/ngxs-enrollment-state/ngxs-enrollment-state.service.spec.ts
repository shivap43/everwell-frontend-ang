import { TestBed } from "@angular/core/testing";
import { EnrollmentMethod } from "@empowered/constants";
import { NgxsModule, Store } from "@ngxs/store";
import { MOCK_NGRX_ENROLLMENT_STATE, MOCK_NGXS_ENROLLMENT_STATE } from "../ngxs-sync.mock";

import { NGXSEnrollmentStateService } from "./ngxs-enrollment-state.service";
import { EnrollmentMethodState, SetEnrollmentMethodSpecific, EnrollmentMethodModel } from "@empowered/ngxs-store";

describe("NGXSEnrollmentStateService", () => {
    let service: NGXSEnrollmentStateService;
    let store: Store;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([EnrollmentMethodState])],
        });
        service = TestBed.inject(NGXSEnrollmentStateService);
        store = TestBed.inject(Store);

        // Mock NGXS state
        store.reset({
            ...store.snapshot(),
            EnrollmentMethodState: {
                specificEnrollment: { ...MOCK_NGXS_ENROLLMENT_STATE },
                currentEnrollment: { ...MOCK_NGXS_ENROLLMENT_STATE },
                visitedMpGroups: [],
            },
        });
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("compareState()", () => {
        it("should return false if mpGroup is different", () => {
            const a = { mpGroup: "1" } as EnrollmentMethodModel;
            const b = { mpGroup: "2" } as EnrollmentMethodModel;

            expect(service.compareState(a, b)).toBe(false);
        });

        it("should return false if memberId is different", () => {
            const a = { mpGroup: "1", memberId: 2 } as EnrollmentMethodModel;
            const b = { ...a, memberId: 3 } as EnrollmentMethodModel;

            expect(service.compareState(a, b)).toBe(false);
        });

        it("should finish comparing states using compareSyncableState()", () => {
            const spy = jest.spyOn(service, "compareSyncableState");
            const a = { mpGroup: "1", memberId: 2 } as EnrollmentMethodModel;
            const b = { ...a } as EnrollmentMethodModel;

            service.compareState(a, b);

            expect(spy).toBeCalledWith(a, b);
        });

        it("should return true if all properties are the same", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
                headSetStateAbbreviation: "CA",
                enrollmentState: "Nevada",
                enrollmentStateAbbreviation: "NV",
                enrollmentCity: "Henderson",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
            } as EnrollmentMethodModel;

            expect(service.compareState(a, b)).toBe(true);
        });
    });

    describe("compareSyncableState()", () => {
        it("should return false if enrollmentMethod is different", () => {
            const a = { mpGroup: "1", memberId: 2, enrollmentMethod: EnrollmentMethod.CALL_CENTER } as EnrollmentMethodModel;
            const b = { ...a, enrollmentMethod: EnrollmentMethod.HEADSET } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if headSetState is different", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
                headSetState: "Arizona",
            } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if headSetStateAbbreviation is different", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
                headSetStateAbbreviation: "CA",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
                headSetStateAbbreviation: "AZ",
            } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if enrollmentState is different", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
                headSetStateAbbreviation: "CA",
                enrollmentState: "Nevada",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
                enrollmentState: "Arizona",
            } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if enrollmentStateAbbreviation is different", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
                headSetStateAbbreviation: "CA",
                enrollmentState: "Nevada",
                enrollmentStateAbbreviation: "NV",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
                enrollmentState: "AZ",
            } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if enrollmentCity is different", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
                headSetStateAbbreviation: "CA",
                enrollmentState: "Nevada",
                enrollmentStateAbbreviation: "NV",
                enrollmentCity: "Henderson",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
                enrollmentCity: "Los Vegas",
            } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return true if all properties are the same", () => {
            const a = {
                mpGroup: "1",
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headSetState: "California",
                headSetStateAbbreviation: "CA",
                enrollmentState: "Nevada",
                enrollmentStateAbbreviation: "NV",
                enrollmentCity: "Henderson",
            } as EnrollmentMethodModel;
            const b = {
                ...a,
            } as EnrollmentMethodModel;

            expect(service.compareSyncableState(a, b)).toBe(true);
        });
    });

    describe("getLatestState()", () => {
        it("should get latest enrollment state from ngrx store", (done) => {
            expect.assertions(1);

            service.getLatestState().subscribe((state) => {
                expect(state).toStrictEqual(MOCK_NGXS_ENROLLMENT_STATE);

                done();
            });
        });

        it("should filter out duplicate states", (done) => {
            expect.assertions(6);

            const spy = jest.spyOn(service, "compareSyncableState");

            // Collect all states emitted
            const states = [];

            service.getLatestState().subscribe((state) => {
                states.push(state);

                // Test expects exactly 2 states
                if (states.length === 2) {
                    // The last value should have the latest changes
                    expect(states).toStrictEqual([
                        MOCK_NGXS_ENROLLMENT_STATE,
                        {
                            ...MOCK_NGXS_ENROLLMENT_STATE,
                            headSetState: "Nevada",
                        },
                    ]);

                    // compareSyncableState should be used to filter duplicate states
                    expect(spy).toBeCalledTimes(2);

                    // The first "change" should be filtered out since both have the same headsetCountryState
                    expect(spy).nthCalledWith(1, MOCK_NGXS_ENROLLMENT_STATE, MOCK_NGXS_ENROLLMENT_STATE);
                    expect(spy).nthReturnedWith(1, true);

                    // The second change should NOT be filtered since headsetCountryState is different
                    expect(spy).nthCalledWith(2, MOCK_NGXS_ENROLLMENT_STATE, {
                        ...MOCK_NGXS_ENROLLMENT_STATE,
                        headSetState: "Nevada",
                    });
                    expect(spy).nthReturnedWith(2, false);

                    done();
                }
            });

            // Simulate updating state but no values change
            const duplicateState = {
                ...MOCK_NGXS_ENROLLMENT_STATE,
                headSetState: "California",
            };

            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: { ...duplicateState },
                    currentEnrollment: { ...duplicateState },
                    visitedMpGroups: [],
                },
            });

            // Simulate updating headset country state
            const updatedState = {
                ...MOCK_NGXS_ENROLLMENT_STATE,
                headSetState: "Nevada",
            };

            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: { ...updatedState },
                    currentEnrollment: { ...updatedState },
                    visitedMpGroups: [],
                },
            });
        });

        it("should get always emit when state is empty or when state is replacing empty", (done) => {
            expect.assertions(1);

            // Collect all states emitted
            const states = [];

            service.getLatestState().subscribe((state) => {
                states.push(state);

                // Test expects exactly 5 states
                if (states.length === 5) {
                    // The last value should have the latest changes
                    expect(states).toStrictEqual([
                        MOCK_NGXS_ENROLLMENT_STATE,
                        null,
                        MOCK_NGXS_ENROLLMENT_STATE,
                        null,
                        MOCK_NGXS_ENROLLMENT_STATE,
                    ]);

                    done();
                }
            });

            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: null,
                    currentEnrollment: null,
                    visitedMpGroups: [],
                },
            });

            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: { ...MOCK_NGXS_ENROLLMENT_STATE },
                    currentEnrollment: { ...MOCK_NGXS_ENROLLMENT_STATE },
                    visitedMpGroups: [],
                },
            });

            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: null,
                    currentEnrollment: null,
                    visitedMpGroups: [],
                },
            });

            store.reset({
                ...store.snapshot(),
                EnrollmentMethodState: {
                    specificEnrollment: { ...MOCK_NGXS_ENROLLMENT_STATE },
                    currentEnrollment: { ...MOCK_NGXS_ENROLLMENT_STATE },
                    visitedMpGroups: [],
                },
            });
        });
    });

    describe("getStateSnapshot()", () => {
        it("should get the latest NGXS enrollment state snapshot", () => {
            expect(service.getStateSnapshot()).toStrictEqual(MOCK_NGXS_ENROLLMENT_STATE);
        });
    });

    describe("getState()", () => {
        it("should convert NGRX enrollment state to NGXS enrollment state", () => {
            expect(service.getState(MOCK_NGRX_ENROLLMENT_STATE)).toStrictEqual(MOCK_NGXS_ENROLLMENT_STATE);
        });
    });

    describe("setState()", () => {
        it("should dispatch action to update NGRX state", () => {
            const spy = jest.spyOn(store, "dispatch");

            service.setState(MOCK_NGRX_ENROLLMENT_STATE);

            expect(spy).toBeCalledWith(new SetEnrollmentMethodSpecific(MOCK_NGXS_ENROLLMENT_STATE));
        });

        it("should avoid dispatching action if existing NGRX enrollment state already matches", () => {
            const spy = jest.spyOn(store, "dispatch");

            service.setState(MOCK_NGRX_ENROLLMENT_STATE, MOCK_NGXS_ENROLLMENT_STATE);

            expect(spy).not.toBeCalled();
        });
    });
});
