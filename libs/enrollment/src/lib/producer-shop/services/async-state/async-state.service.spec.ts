import { TestBed } from "@angular/core/testing";
import { AlertType, AsyncStatus } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { provideMockStore } from "@ngrx/store/testing";
import { combineLatest, of } from "rxjs";
import { initialState } from "./async-state.mock";

import { AsyncStateService } from "./async-state.service";

describe("AsyncStateService", () => {
    let service: AsyncStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NGRXStore, provideMockStore({ initialState })],
        });

        service = TestBed.inject(AsyncStateService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getAsyncDataSelectors()", () => {
        it("should return array of selectors used for checking loading/error state", (done) => {
            expect.assertions(1);

            combineLatest(service.getAsyncDataSelectors()).subscribe((asyncDatas) => {
                expect(asyncDatas).toStrictEqual([
                    // // Products / Plan Offerings selectors
                    PlanOfferingsSelectors.getSelectedCombinedOfferings(initialState),
                    PlanOfferingsSelectors.getSelectedPlanOfferings(initialState),
                    // Selectors involving enrollment settings dropdowns
                    PlanOfferingsSelectors.getSelectedCoverageDatesRecord(initialState),
                    MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity(initialState),
                    MembersSelectors.getSelectedPossibleRiskClassSets(initialState),
                    MembersSelectors.getSelectedMemberProfile(initialState),
                    MembersSelectors.getSelectedSalarySummary(initialState),
                    MembersSelectors.getSelectedMemberDependents(initialState),
                ]);

                done();
            });
        });
    });

    describe("getAsyncDatas()", () => {
        it("should handle empty array", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDataSelectors").mockReturnValueOnce([]);

            service.getAsyncDatas().subscribe((asyncDatas) => {
                expect(asyncDatas).toStrictEqual([]);

                done();
            });
        });

        it("should get all of the AsyncDatas from the passed selector Observables", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDataSelectors").mockReturnValueOnce([
                of({ status: AsyncStatus.IDLE }),
                of({ status: AsyncStatus.LOADING }),
                of({ status: AsyncStatus.SUCCEEDED, value: "moo", error: null }),
                of({ status: AsyncStatus.IDLE, value: null, error: { message: "some error" } }),
            ]);

            service.getAsyncDatas().subscribe((asyncDatas) => {
                expect(asyncDatas).toStrictEqual([
                    { status: AsyncStatus.IDLE },
                    { status: AsyncStatus.LOADING },
                    { status: AsyncStatus.SUCCEEDED, value: "moo", error: null },
                    { status: AsyncStatus.IDLE, value: null, error: { message: "some error" } },
                ]);

                done();
            });
        });
    });

    describe("isLoading()", () => {
        it("should return true if at least one AsyncData is loading (not including errors)", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDatas").mockReturnValueOnce(
                of([
                    { status: AsyncStatus.IDLE },
                    { status: AsyncStatus.LOADING },
                    { status: AsyncStatus.SUCCEEDED, value: "moo", error: null },
                ]),
            );

            service.isLoading().subscribe((isLoading) => {
                expect(isLoading).toBe(true);

                done();
            });
        });

        it("should return false if at least one AsyncData failed regardless if others are loading", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDatas").mockReturnValueOnce(
                of([{ status: AsyncStatus.IDLE }, { status: AsyncStatus.LOADING }, { status: AsyncStatus.FAILED, value: null, error: {} }]),
            );

            service.isLoading().subscribe((isLoading) => {
                expect(isLoading).toBe(false);

                done();
            });
        });

        it("should return false if no AsyncDatas have status loading or failed", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDatas").mockReturnValueOnce(
                of([
                    { status: AsyncStatus.IDLE },
                    { status: AsyncStatus.IDLE },
                    { status: AsyncStatus.SUCCEEDED, value: "moo", error: null },
                ]),
            );

            service.isLoading().subscribe((isLoading) => {
                expect(isLoading).toBe(false);

                done();
            });
        });
    });

    describe("getErrorMessage()", () => {
        it("should return null if there are no failed AsyncData", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDatas").mockReturnValueOnce(
                of([
                    { status: AsyncStatus.LOADING },
                    { status: AsyncStatus.IDLE },
                    { status: AsyncStatus.SUCCEEDED, value: "moo", error: null },
                ]),
            );

            service.getErrorMessage().subscribe((errorMessage) => {
                expect(errorMessage).toBeNull();

                done();
            });
        });

        it("should return ErrorMessage from AsyncDatas", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDatas").mockReturnValueOnce(
                of([
                    {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: { language: { displayText: "some display text", languageTag: "some languageTag" } },
                    },
                    { status: AsyncStatus.IDLE },
                    { status: AsyncStatus.SUCCEEDED, value: "moo", error: null },
                ]),
            );

            service.getErrorMessage().subscribe((errorMessage) => {
                expect(errorMessage).toStrictEqual({ displayText: "some display text", language: "some languageTag" });

                done();
            });
        });

        it("should return first ErrorMessage if there are no failed AsyncData", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getAsyncDatas").mockReturnValueOnce(
                of([
                    { status: AsyncStatus.IDLE },
                    {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: { language: { displayText: "first display text", languageTag: "first languageTag" } },
                    },
                    { status: AsyncStatus.SUCCEEDED, value: "moo", error: null },
                    {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: { language: { displayText: "second display text", languageTag: "second languageTag" } },
                    },
                ]),
            );

            service.getErrorMessage().subscribe((errorMessage) => {
                expect(errorMessage).toStrictEqual({ displayText: "first display text", language: "first languageTag" });

                done();
            });
        });
    });

    describe("getAlertMessage()", () => {
        it("should return null if there are no ErrorMessage", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getErrorMessage").mockReturnValueOnce(of(null));

            service.getAlertMessage(AlertType.DANGER).subscribe((errorMessage) => {
                expect(errorMessage).toBeNull();

                done();
            });
        });

        it("should return AlertMessage from ErrorMessage", (done) => {
            expect.assertions(1);

            jest.spyOn(service, "getErrorMessage").mockReturnValueOnce(
                of({
                    language: "some language",
                    displayText: "some displayText",
                }),
            );

            service.getAlertMessage(AlertType.DANGER).subscribe((errorMessage) => {
                expect(errorMessage).toStrictEqual({
                    language: "some language",
                    displayText: "some displayText",
                    alertType: AlertType.DANGER,
                });

                done();
            });
        });
    });
});
