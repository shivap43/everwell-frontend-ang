import { TestBed } from "@angular/core/testing";
import { from, OperatorFunction, pipe } from "rxjs";
import * as rxjsOperators from "rxjs/operators";
import { NxModule } from "@nrwl/angular";
import { Action, select } from "@ngrx/store";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "./app.ngrx.facade";
import { State } from "./ngrx-states/app.state";
import { SharedActions, SharedSelectors, SharedState } from "./ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "./ngrx-states/shared/shared.reducer";
import { mockGenders } from "./ngrx-states/shared/shared.mocks";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "./ngrx-states/members/members.reducer";
import { MembersState } from "./ngrx-states/members";
import { AsyncStatus, FailedAsyncData, Nullish, SucceededAsyncData, Gender, ApiError } from "@empowered/constants";

describe("NGRXStore", () => {
    let service: NGRXStore;
    let store: MockStore<State>;

    const initialState: SharedPartialState & MembersPartialState = {
        [SHARED_FEATURE_KEY]: {
            ...SharedState.initialState,
            genders: {
                status: AsyncStatus.SUCCEEDED,
                value: mockGenders,
                error: null,
            },
            countries: {
                status: AsyncStatus.LOADING,
            },
            riskClasses: {
                status: AsyncStatus.IDLE,
            },
        },
        [MEMBERS_FEATURE_KEY]: {
            ...MembersState.initialState,
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NxModule.forRoot()],
            providers: [
                NGRXStore,
                provideMockStore({
                    initialState,
                }),
            ],
        });

        service = TestBed.inject(NGRXStore);
        store = TestBed.inject(MockStore);
    });

    it("should be truthy", () => {
        expect(service).toBeTruthy();
    });

    describe("dispatch()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should call store's dispatch", () => {
            const mockAction = { type: "fake" } as Action;
            const spy = jest.spyOn(store, "dispatch");
            service.dispatch(mockAction);
            expect(spy).toBeCalledWith(mockAction);
        });
    });

    describe("snapshot()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should get value from store synchronously", () => {
            const operatorFunction: OperatorFunction<State, string> = rxjsOperators.mapTo("moo");
            const spy = jest.spyOn(store, "pipe");
            const takeOperatorMock = pipe(rxjsOperators.map((x) => x));
            const spy2 = jest.spyOn(rxjsOperators, "take").mockReturnValue(takeOperatorMock);

            const result = service["snapshot"](operatorFunction);

            expect(spy).toBeCalledWith(operatorFunction, takeOperatorMock);
            expect(spy2).toBeCalledWith(1);
            expect(result).toBe("moo");
        });

        it("should throw when Observable doesn't emit synchronously", () => {
            // OperatorFunction that never emits a value
            const operatorFunction: OperatorFunction<State, any> = rxjsOperators.filter(() => false);
            const spy = jest.spyOn(store, "pipe");
            const takeOperatorMock = pipe(rxjsOperators.map((x) => x));
            const spy2 = jest.spyOn(rxjsOperators, "take").mockReturnValue(takeOperatorMock);

            expect(() => service["snapshot"](operatorFunction)).toThrow("Unexpected snapshot failed");
            expect(spy).toBeCalledWith(operatorFunction, takeOperatorMock);
            expect(spy2).toBeCalledWith(1);
        });
    });

    describe("dispatchIfNotCached()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should dispatch Action if AsyncStatus is NOT SUCCEEDED", () => {
            const spy = jest.spyOn(store, "dispatch");
            service["dispatchIfNotCached"](SharedActions.loadCountries());
            const result = SharedSelectors.getAllCountries({ ...initialState });
            expect(result).toStrictEqual({
                status: AsyncStatus.LOADING,
            });
            expect(spy).toBeCalledWith(SharedActions.loadCountries());
        });

        it("should NOT dispatch Action if AsyncStatus is SUCCEEDED", () => {
            const spy = jest.spyOn(store, "dispatch");
            service["dispatchIfNotCached"](SharedActions.loadGenders());
            const result = SharedSelectors.getAllGenders({ ...initialState });
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: mockGenders,
                error: null,
            });
            expect(spy).not.toBeCalled();
        });
    });

    describe("dispatchIfIdle()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should NOT distach Action if AsyncStatus is NOT IDLE", () => {
            const spy = jest.spyOn(store, "dispatch");
            service.dispatchIfIdle(SharedActions.loadGenders(), SharedSelectors.getAllCountries);
            const result = SharedSelectors.getAllCountries({ ...initialState });
            expect(result).toStrictEqual({
                status: AsyncStatus.LOADING,
            });
            expect(spy).not.toBeCalled();
        });

        it("should distach Action if AsyncStatus is IDLE", () => {
            const spy = jest.spyOn(store, "dispatch");
            service.dispatchIfIdle(SharedActions.loadGenders(), SharedSelectors.getCarrierRiskClasses);
            const result = SharedSelectors.getCarrierRiskClasses({ ...initialState });
            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
            expect(spy).toBeCalled();
        });
    });

    describe("dispatch()", () => {
        it("should call store's dispatch", () => {
            const mockAction = { type: "fake" } as Action;
            const spy = jest.spyOn(store, "dispatch");
            service.dispatch(mockAction);
            expect(spy).toBeCalledWith(mockAction);
        });

        it("should call dispatchIfNotCached if checkIfSharedActionIsCached is true", () => {
            const mockAction = SharedActions.loadCountries();
            const spy = jest.spyOn(store, "dispatch");
            service.dispatch(SharedActions.loadCountries(), true);
            expect(spy).toBeCalledWith(mockAction);
        });
    });

    describe("pipe()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should call NGRX store's pipe", () => {
            const operatorFunction: OperatorFunction<State, string> = rxjsOperators.mapTo("moo");
            const spy = jest.spyOn(store, "pipe");
            service.pipe(operatorFunction);
            expect(spy).toBeCalledWith(operatorFunction);
        });
    });

    describe("isNullish()", () => {
        it("should return false if value is not null or undefined", () => {
            const result = service.isNullish("moo");
            expect(result).toBe(false);
        });

        it("should return false if value is empty string even though empty string is falsy", () => {
            const result = service.isNullish("");
            expect(result).toBe(false);
        });

        it("should return false if value is 0 even though 0 is falsy", () => {
            const result = service.isNullish(0);
            expect(result).toBe(false);
        });

        it("should return false if value is false even though false is falsy", () => {
            const result = service.isNullish(false);
            expect(result).toBe(false);
        });

        it("should return true if value is null", () => {
            const result = service.isNullish(null);
            expect(result).toBe(true);
        });

        it("should return true if value is undefined", () => {
            const result = service.isNullish(undefined);
            expect(result).toBe(true);
        });
    });

    describe("filterForNonNullish()", () => {
        it("should emit values that are not null or undefined", () => {
            const spy = jest.spyOn(service, "isNullish");

            const values: string[] = [];

            from(["moo", "cow"])
                .pipe(service.filterForNonNullish())
                .subscribe((value) => {
                    values.push(value);
                });

            expect(spy).toHaveNthReturnedWith(1, false);
            expect(spy).toHaveNthReturnedWith(2, false);
            expect(spy).toBeCalledTimes(2);
            expect(values).toStrictEqual(["moo", "cow"]);
        });

        it("should not emit values that are null or undefined", () => {
            const spy = jest.spyOn(service, "isNullish");

            const values: string[] = [];

            from([null, undefined, "some string"])
                .pipe(service.filterForNonNullish())
                .subscribe((value) => {
                    values.push(value);
                });

            expect(spy).toHaveNthReturnedWith(1, true);
            expect(spy).toHaveNthReturnedWith(2, true);
            expect(spy).toHaveNthReturnedWith(3, false);
            expect(spy).toBeCalledTimes(3);
            expect(values).toStrictEqual(["some string"]);
        });
    });

    describe("hasAsyncStatus()", () => {
        it("should return false if AsyncData is null", () => {
            const result = service.hasAsyncStatus(null, AsyncStatus.SUCCEEDED);
            expect(result).toBe(false);
        });

        it("should return false if AsyncData is undefined", () => {
            const result = service.hasAsyncStatus(undefined, AsyncStatus.SUCCEEDED);
            expect(result).toBe(false);
        });

        it("should return true if AsyncData has matching AsyncStatus", () => {
            const result = service.hasAsyncStatus({ status: AsyncStatus.SUCCEEDED, value: 9, error: null }, AsyncStatus.SUCCEEDED);
            expect(result).toBe(true);
        });

        it("should return false if AsyncData has mismatched AsyncStatus", () => {
            const result = service.hasAsyncStatus({ status: AsyncStatus.LOADING, value: 9, error: null }, AsyncStatus.SUCCEEDED);
            expect(result).toBe(false);
        });
    });

    describe("onAsyncValue()", () => {
        it("should emit values from AsyncDatas that have AsyncStatus.SUCCEEDED", () => {
            const mock: FailedAsyncData<number> = { status: AsyncStatus.FAILED, value: null, error: {} as ApiError };
            const operatorFunction: OperatorFunction<State, FailedAsyncData<number>> = rxjsOperators.mapTo(mock);

            const spy = jest.spyOn(service, "onAsyncValue");
            const spy2 = jest.spyOn(service, "hasAsyncStatus");

            const values: number[] = [];

            service.onAsyncValue(operatorFunction).subscribe((value) => {
                values.push(value);
                expect(spy).toBeCalledTimes(1);
            });

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toHaveBeenLastCalledWith(mock, AsyncStatus.SUCCEEDED);
            expect(spy2).toHaveLastReturnedWith(false);
            expect(values).toStrictEqual([]);
        });

        it("should emit values from AsyncDatas that have AsyncStatus.SUCCEEDED", (done) => {
            expect.assertions(4);

            const mock: SucceededAsyncData<number> = { status: AsyncStatus.SUCCEEDED, value: 9, error: null };
            const operatorFunction: OperatorFunction<State, SucceededAsyncData<number>> = rxjsOperators.mapTo(mock);

            const spy = jest.spyOn(service, "onAsyncValue");
            const spy2 = jest.spyOn(service, "hasAsyncStatus");

            service.onAsyncValue(operatorFunction).subscribe((value) => {
                expect(value).toBe(9);
                expect(spy).toBeCalledTimes(1);
                expect(spy2).toHaveBeenLastCalledWith(mock, AsyncStatus.SUCCEEDED);
                expect(spy2).toHaveLastReturnedWith(true);
                done();
            });
        });

        it("should not emit values if ngrx state changes from AsyncStatus.SUCCEEDED to AsyncStatus.LOADING", () => {
            // service.onAsyncValue shouldn't emit values unless AsyncStatus.SUCCEEDED (like AsyncStatus.LOADING)
            // service.pipe acts differently and should emit a value
            // This test compares these two methods

            // There should be 2 assertions:
            // 1. for checking the proper order and number of emited values
            // 2. for checking that service.pipe emits value undefined when AsyncStatus.LOADING

            expect.assertions(2);
            // Collect all the emited values using service.pipe and service.onAsyncValue
            const values: { type: "pipe" | "onAsyncValue"; value: Gender[] | Nullish }[] = [];

            service.pipe(select(SharedSelectors.getAllGenders)).subscribe((asyncData) => {
                // There should only be one case where there is no value, and that is when AsyncData has AsyncStatus.LOADING
                if (!asyncData.value) {
                    expect(asyncData.status).toBe(AsyncStatus.LOADING);
                }

                // Each value should be labeled as 'pipe' since it uses service.pipe
                values.push({
                    type: "pipe",
                    value: asyncData.value, // [[Gender.FEMALE, Gender.Male], undefined, [Gender.UNKNOWN]]
                });
            });

            service.onAsyncValue(select(SharedSelectors.getAllGenders)).subscribe((value) => {
                // Each value should be labeled as 'onAsyncValue' since it uses service.onAsyncValue
                values.push({
                    type: "onAsyncValue",
                    value, // [[Gender.FEMALE, Gender.Male], [Gender.UNKNOWN]]
                });
            });

            // Simulate setting AsyncStatus.LOADING
            store.setState({
                ...initialState,
                [SHARED_FEATURE_KEY]: {
                    ...initialState[SHARED_FEATURE_KEY],
                    genders: {
                        status: AsyncStatus.LOADING,
                    },
                },
            } as State);

            // Simulate setting back to AsyncStatus.SUCCEEDED
            store.setState({
                ...initialState,
                [SHARED_FEATURE_KEY]: {
                    ...initialState[SHARED_FEATURE_KEY],
                    genders: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [Gender.UNKNOWN],
                    },
                },
            } as State);

            expect(values).toStrictEqual([
                // The first two values should AsyncData has AsyncStatus.SUCCEEDED
                {
                    type: "pipe",
                    value: [Gender.FEMALE, Gender.MALE],
                },
                {
                    type: "onAsyncValue",
                    value: [Gender.FEMALE, Gender.MALE],
                },
                // The next value should only emit using service.pipe since AsyncStatus.LOADING
                {
                    type: "pipe",
                    value: undefined,
                },
                // The last two values should since both has AsyncStatus.SUCCEEDED
                {
                    type: "pipe",
                    value: [Gender.UNKNOWN],
                },
                {
                    type: "onAsyncValue",
                    value: [Gender.UNKNOWN],
                },
            ]);
        });
    });

    describe("ngrxStateHasSelectedMemberId()", () => {
        it("should return true if ngrx MembersState has selectedMemberId", () => {
            store.setState({
                ...initialState,
                [MEMBERS_FEATURE_KEY]: {
                    ...initialState[MEMBERS_FEATURE_KEY],
                    selectedMemberId: 111,
                },
            } as State);

            expect(service.ngrxStateHasSelectedMemberId()).toBe(true);
        });

        it("should return false if ngrx MembersState does NOT have selectedMemberId", () => {
            store.setState({
                ...initialState,
                [MEMBERS_FEATURE_KEY]: {
                    ...initialState[MEMBERS_FEATURE_KEY],
                    selectedMemberId: null,
                },
            } as State);

            expect(service.ngrxStateHasSelectedMemberId()).toBe(false);
        });
    });
});
