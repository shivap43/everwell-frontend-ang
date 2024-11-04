import { TestBed } from "@angular/core/testing";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { EnrollmentMethod } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { State } from "@empowered/ngrx-store/ngrx-states/app.state";
import { SharedActions } from "@empowered/ngrx-store/ngrx-states/shared";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";

import { NGRXEnrollmentState } from "../ngrx-sync.model";
import { mockInitialState, MOCK_NGRX_ENROLLMENT_STATE, MOCK_NGXS_ENROLLMENT_STATE } from "../ngxs-sync.mock";
import { NGRXEnrollmentStateService } from "./ngrx-enrollment-state.service";

describe("NGRXEnrollmentStateService", () => {
    let service: NGRXEnrollmentStateService;
    let store: MockStore;
    let ngrxStore: NGRXStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NGRXStore, provideMockStore({ initialState: mockInitialState })],
        });
        service = TestBed.inject(NGRXEnrollmentStateService);
        store = TestBed.inject(MockStore);
        ngrxStore = TestBed.inject(NGRXStore);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("compareState()", () => {
        it("should return false if mpGroup is different", () => {
            const a: NGRXEnrollmentState = { mpGroup: 1 };
            const b: NGRXEnrollmentState = { mpGroup: 2 };

            expect(service.compareState(a, b)).toBe(false);
        });

        it("should return false if memberId is different", () => {
            const a: NGRXEnrollmentState = { mpGroup: 1, memberId: 2 };
            const b: NGRXEnrollmentState = { ...a, memberId: 3 };

            expect(service.compareState(a, b)).toBe(false);
        });

        it("should finish comparing states using compareSyncableState()", () => {
            const spy = jest.spyOn(service, "compareSyncableState");
            const a: NGRXEnrollmentState = { mpGroup: 1, memberId: 2 };
            const b: NGRXEnrollmentState = { ...a };

            service.compareState(a, b);

            expect(spy).toBeCalledWith(a, b);
        });

        it("should return true if all properties are the same", () => {
            const a: NGRXEnrollmentState = {
                mpGroup: 1,
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headsetCountryState: { abbreviation: "CA", name: "California" },
                selectedCountryState: { abbreviation: "NV", name: "Nevada" },
                selectedCity: "Henderson",
            };
            const b: NGRXEnrollmentState = {
                ...a,
            };

            expect(service.compareState(a, b)).toBe(true);
        });
    });

    describe("compareSyncableState()", () => {
        it("should return false if enrollmentMethod is different", () => {
            const a: NGRXEnrollmentState = { mpGroup: 1, memberId: 2, enrollmentMethod: EnrollmentMethod.CALL_CENTER };
            const b: NGRXEnrollmentState = { ...a, enrollmentMethod: EnrollmentMethod.HEADSET };

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if headsetCountryState is different", () => {
            const a: NGRXEnrollmentState = {
                mpGroup: 1,
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headsetCountryState: { abbreviation: "AZ", name: "Arizona" },
            };
            const b: NGRXEnrollmentState = {
                ...a,
                headsetCountryState: { abbreviation: "CA", name: "California" },
            };

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if selectedCountryState is different", () => {
            const a: NGRXEnrollmentState = {
                mpGroup: 1,
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headsetCountryState: { abbreviation: "CA", name: "California" },
                selectedCountryState: { abbreviation: "AZ", name: "Arizona" },
            };
            const b: NGRXEnrollmentState = {
                ...a,
                selectedCountryState: { abbreviation: "NV", name: "Nevada" },
            };

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return false if selectedCity is different", () => {
            const a: NGRXEnrollmentState = {
                mpGroup: 1,
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headsetCountryState: { abbreviation: "CA", name: "California" },
                selectedCountryState: { abbreviation: "NV", name: "Nevada" },
                selectedCity: "Henderson",
            };
            const b: NGRXEnrollmentState = {
                ...a,
                selectedCity: "Los Angeles",
            };

            expect(service.compareSyncableState(a, b)).toBe(false);
        });

        it("should return true if all properties are the same", () => {
            const a: NGRXEnrollmentState = {
                mpGroup: 1,
                memberId: 2,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                headsetCountryState: { abbreviation: "CA", name: "California" },
                selectedCountryState: { abbreviation: "NV", name: "Nevada" },
                selectedCity: "Henderson",
            };
            const b: NGRXEnrollmentState = {
                ...a,
            };

            expect(service.compareSyncableState(a, b)).toBe(true);
        });
    });

    describe("getLatestState()", () => {
        it("should get latest enrollment state from ngrx store", (done) => {
            expect.assertions(1);

            service.getLatestState().subscribe((state) => {
                expect(state).toStrictEqual(MOCK_NGRX_ENROLLMENT_STATE);

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
                        MOCK_NGRX_ENROLLMENT_STATE,
                        {
                            ...MOCK_NGRX_ENROLLMENT_STATE,
                            headsetCountryState: { abbreviation: "NV", name: "Nevada" },
                        },
                    ]);

                    // compareSyncableState should be used to filter duplicate states
                    expect(spy).toBeCalledTimes(2);

                    // The first "change" should be filtered out since both have the same headsetCountryState
                    expect(spy).nthCalledWith(1, MOCK_NGRX_ENROLLMENT_STATE, MOCK_NGRX_ENROLLMENT_STATE);
                    expect(spy).nthReturnedWith(1, true);

                    // The second change should NOT be filtered since headsetCountryState is different
                    expect(spy).nthCalledWith(2, MOCK_NGRX_ENROLLMENT_STATE, {
                        ...MOCK_NGRX_ENROLLMENT_STATE,
                        headsetCountryState: { abbreviation: "NV", name: "Nevada" },
                    });
                    expect(spy).nthReturnedWith(2, false);

                    done();
                }
            });

            // Simulate updating state but no values change
            store.setState({
                ...mockInitialState,
                [SHARED_FEATURE_KEY]: {
                    ...mockInitialState[SHARED_FEATURE_KEY],
                    selectedHeadsetState: { abbreviation: "CA", name: "California" },
                },
            } as State);

            // Simulate updating headset country state
            store.setState({
                ...mockInitialState,
                [SHARED_FEATURE_KEY]: {
                    ...mockInitialState[SHARED_FEATURE_KEY],
                    selectedHeadsetState: { abbreviation: "NV", name: "Nevada" },
                },
            } as State);
        });
    });

    describe("getState()", () => {
        it("should convert NGXS enrollment state to NGRX enrollment state", () => {
            expect(service.getState(MOCK_NGXS_ENROLLMENT_STATE)).toStrictEqual(MOCK_NGRX_ENROLLMENT_STATE);
        });
    });

    describe("setState()", () => {
        it("should dispatch action to update NGRX state", () => {
            const spy = jest.spyOn(ngrxStore, "dispatch");

            service.setState(MOCK_NGXS_ENROLLMENT_STATE);

            expect(spy).toBeCalledWith(
                SharedActions.setSelectedEnrollmentMethodState({
                    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    countryState: { abbreviation: "AZ", name: "Arizona" },
                    city: "Los Angeles",
                    headsetCountryState: { abbreviation: "CA", name: "California" },
                }),
            );
        });

        it("should avoid dispatching action if existing NGRX enrollment state already matches", () => {
            const spy = jest.spyOn(ngrxStore, "dispatch");

            service.setState(MOCK_NGXS_ENROLLMENT_STATE, MOCK_NGRX_ENROLLMENT_STATE);

            expect(spy).not.toBeCalled();
        });
    });
});
