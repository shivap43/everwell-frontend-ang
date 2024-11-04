import { AsyncData, AsyncStatus, Entity, ApiError } from "@empowered/constants";
import { EntityState } from "@ngrx/entity";
import {
    combineAsyncDatas,
    flattenAsyncData,
    getAsyncData,
    getAsyncDataFromEntitiesState,
    getEntityId,
    getErrorMessage,
    getFailedAsyncData,
    getIdleAsyncData,
    getLoadingAsyncData,
    getSerializableError,
    getSucceededAsyncData,
    mapAsyncData,
} from "./ngrx.store.helpers";

describe("NGRX Store Helpers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getIdleAsyncData", () => {
        it("should get AsyncData with AsyncStatus.IDLE", () => {
            const result = getIdleAsyncData();

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });
        });
    });

    describe("getLoadingAsyncData", () => {
        it("should get AsyncData with AsyncStatus.LOADING", () => {
            const result = getLoadingAsyncData();

            expect(result).toStrictEqual({ status: AsyncStatus.LOADING });
        });
    });

    describe("getSucceededAsyncData", () => {
        it("should get AsyncData with AsyncStatus.FAILED", () => {
            const result = getFailedAsyncData({ message: "some error message" } as ApiError);

            expect(result).toStrictEqual({ status: AsyncStatus.FAILED, value: null, error: { message: "some error message" } });
        });
    });

    describe("getFailedAsyncData", () => {
        it("should get AsyncData with AsyncStatus.SUCCEEDED", () => {
            const result = getSucceededAsyncData("moo");

            expect(result).toStrictEqual({ status: AsyncStatus.SUCCEEDED, value: "moo", error: null });
        });
    });

    describe("getAsyncData", () => {
        it("should fallback to AsyncData with AsyncStatus.IDLE if argument is null or undefined", () => {
            const result = getAsyncData(null);

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });
        });
    });

    describe("getAsyncDataFromEntitiesState()", () => {
        it("should return AsyncData instance from EntityState entities (Dictionary) given an id", () => {
            const entityInstance: Entity<{ moo: string; cow: number }, AsyncData<{ desc: string }>> = {
                identifiers: { moo: "cow", cow: 9 },
                data: { status: AsyncStatus.SUCCEEDED, value: { desc: "some entity" }, error: null },
            };

            const entityState: EntityState<Entity<{ moo: string; cow: number }, AsyncData<{ desc: string }>>> = {
                ids: ["cow-9"],
                entities: { "cow-9": entityInstance },
            };

            const result = getAsyncDataFromEntitiesState(entityState, "cow-9");

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { desc: "some entity" },
                error: null,
            });
        });
    });

    describe("mapAsyncData()", () => {
        it("should return object with just AsyncStatus.IDLE if no argument is passed", () => {
            const result = mapAsyncData(null, (asyncData) => asyncData.value);

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });
        });

        it("should return object with just AsyncStatus.IDLE if AsyncData has status AsyncStatus.IDLE", () => {
            const idleAsyncData: AsyncData<unknown> = { status: AsyncStatus.IDLE };
            const result = mapAsyncData(idleAsyncData, (asyncData) => asyncData.value);

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });

            // Check for immutability
            expect(result).not.toBe(idleAsyncData);
        });

        it("should return object with just AsyncStatus.LOADING if AsyncData has status AsyncStatus.LOADING", () => {
            const loadingAsyncData: AsyncData<unknown> = getLoadingAsyncData();
            const result = mapAsyncData(loadingAsyncData, (asyncData) => asyncData.value);

            expect(result).toStrictEqual(getLoadingAsyncData());

            // Check for immutability
            expect(result).not.toBe(loadingAsyncData);
        });

        it("should return object with just AsyncStatus.FAILED if AsyncData has status AsyncStatus.FAILED and error", () => {
            const failedAsyncData: AsyncData<unknown> = {
                status: AsyncStatus.FAILED,
                value: null,
                error: { message: "some message" } as ApiError,
            };
            const result = mapAsyncData(failedAsyncData, (asyncData) => asyncData.value);

            expect(result).toStrictEqual({
                status: AsyncStatus.FAILED,
                value: null,
                error: { message: "some message" } as ApiError,
            });

            // Check for immutability
            expect(result).not.toBe(failedAsyncData);
        });

        it("should return object with just AsyncStatus.SUCCEEDED if AsyncData has status AsyncStatus.SUCCEEDED with transformed value", () => {
            const succeededAsyncData: AsyncData<unknown> = { status: AsyncStatus.SUCCEEDED, value: 900, error: null };

            const result = mapAsyncData(succeededAsyncData, (asyncData) => String(asyncData.value));

            expect(result).toStrictEqual({ status: AsyncStatus.SUCCEEDED, value: "900", error: null });

            // Check for immutability
            expect(result).not.toBe(succeededAsyncData);
        });
    });

    describe("combineAsyncDatas()", () => {
        it("should have status AsyncStatus.FAILED when at least one AsyncData has status AsyncStatus.FAILED", () => {
            const result = combineAsyncDatas([
                {
                    status: AsyncStatus.FAILED,
                    error: { message: "some error message" } as ApiError,
                    value: null,
                },
                {
                    status: AsyncStatus.IDLE,
                },
                {
                    status: AsyncStatus.LOADING,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 9,
                    error: null,
                },
            ]);

            expect(result).toStrictEqual({
                status: AsyncStatus.FAILED,
                value: null,
                error: { message: "some error message" },
            });
        });

        it("should have same error of first AsyncData with status AsyncStatus.FAILED", () => {
            const result = combineAsyncDatas([
                {
                    status: AsyncStatus.IDLE,
                },
                {
                    status: AsyncStatus.FAILED,
                    error: { message: "first" } as ApiError,
                    value: null,
                },
                {
                    status: AsyncStatus.FAILED,
                    error: { message: "second" } as ApiError,
                    value: null,
                },
                {
                    status: AsyncStatus.FAILED,
                    error: { message: "third" } as ApiError,
                    value: null,
                },
                {
                    status: AsyncStatus.LOADING,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 9,
                    error: null,
                },
            ]);

            expect(result).toStrictEqual({ status: AsyncStatus.FAILED, value: null, error: { message: "first" } });
        });

        it("should have status AsyncStatus.IDLE when at least one AsyncData has status AsyncStatus.IDLE", () => {
            const result = combineAsyncDatas([
                {
                    status: AsyncStatus.IDLE,
                },
                {
                    status: AsyncStatus.LOADING,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 9,
                    error: null,
                },
            ]);

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });
        });

        it("should have status AsyncStatus.LOADING when at least one AsyncData has status AsyncStatus.LOADING", () => {
            const result = combineAsyncDatas([
                {
                    status: AsyncStatus.LOADING,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 9,
                    error: null,
                },
            ]);

            expect(result).toStrictEqual(getLoadingAsyncData());
        });

        it("should have status AsyncStatus.SUCCEEDED when all AsyncData has status AsyncStatus.SUCCEEDED", () => {
            const result = combineAsyncDatas([
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 10,
                    error: null,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 9,
                    error: null,
                },
            ]);

            expect(result.status).toBe(AsyncStatus.SUCCEEDED);
        });

        it("should combine all values into an array of values for return AsyncData", () => {
            const result = combineAsyncDatas([
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: 1,
                    error: null,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: "two",
                    error: null,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: { count: 3 },
                    error: null,
                },
            ]);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [1, "two", { count: 3 }],
                error: null,
            });
        });
    });

    describe("flattenAsyncData", () => {
        it("should return object with just AsyncStatus.IDLE if no argument is passed", () => {
            const result = flattenAsyncData(null);

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });
        });

        it("should return object with just AsyncStatus.IDLE if parent AsyncData has status AsyncStatus.IDLE", () => {
            const idleAsyncData: AsyncData<AsyncData<unknown>> = { status: AsyncStatus.IDLE };
            const result = flattenAsyncData(idleAsyncData);

            expect(result).toStrictEqual({ status: AsyncStatus.IDLE });

            // Check for immutability
            expect(result).not.toBe(idleAsyncData);
        });

        it("should return object with just AsyncStatus.LOADING if parent AsyncData has status AsyncStatus.LOADING", () => {
            const loadingAsyncData: AsyncData<AsyncData<unknown>> = getLoadingAsyncData();
            const result = flattenAsyncData(loadingAsyncData);

            expect(result).toStrictEqual(getLoadingAsyncData());

            // Check for immutability
            expect(result).not.toBe(loadingAsyncData);
        });

        it("should return object with just AsyncStatus.FAILED if parent AsyncData has status AsyncStatus.FAILED and error", () => {
            const failedAsyncData: AsyncData<AsyncData<unknown>> = {
                status: AsyncStatus.FAILED,
                value: null,
                error: { message: "some message" } as ApiError,
            };
            const result = flattenAsyncData(failedAsyncData);

            expect(result).toStrictEqual({
                status: AsyncStatus.FAILED,
                value: null,
                error: { message: "some message" } as ApiError,
            });

            // Check for immutability
            expect(result).not.toBe(failedAsyncData);
        });

        it("should return child AsyncData object if parent AsyncData has status AsyncStatus.SUCCEEDED", () => {
            const succeededAsyncData: AsyncData<AsyncData<unknown>> = {
                status: AsyncStatus.SUCCEEDED,
                value: { status: AsyncStatus.SUCCEEDED, value: 900, error: null },
                error: null,
            };

            const result = flattenAsyncData(succeededAsyncData);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: 900,
                error: null,
            });

            // Check for immutability
            expect(result).not.toBe(succeededAsyncData);
        });
    });

    describe("getEntityId()", () => {
        it("should combine arguments into a string and separate them with '-'", () => {
            const result = getEntityId(9, true, "moo", false, 0);

            expect(result).toBe(`${9}-${true}-${"moo"}-${false}-${0}`);
        });

        it("should treat empty string, null, and undefined as empty string: ''", () => {
            const result = getEntityId("", null, undefined);

            expect(result).toBe(`${""}-${""}-${""}`);
        });
    });

    describe("getSerializableError()", () => {
        it("should return same ApiError instance", () => {
            const apiError = { message: "some error" };
            // Important that we use toBe instead of toStrictEqual to ensure same instance
            expect(getSerializableError(apiError)).toBe(apiError);
            // Ensure no mutations
            expect(getSerializableError(apiError)).toStrictEqual({ message: "some error" });
        });

        it("should return fallback ApiError if argument is some instance of a class", () => {
            // silence expected console errors
            const spy = jest.spyOn(console, "error").mockImplementationOnce(() => {});

            const notApiError = new Event("some weird event error");
            expect(getSerializableError(notApiError)).toStrictEqual({ status: "", errorKey: "", value: "" });

            expect(spy).toBeCalledTimes(1);
        });

        it("should return fallback ApiError if argument is some instance of a Error", () => {
            // silence expected console errors
            const spy = jest.spyOn(console, "error").mockImplementationOnce(() => {});

            const notApiError = new Error("some real error instance");
            expect(getSerializableError(notApiError)).toStrictEqual({ status: "", errorKey: "", value: "" });

            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getErrorMessage()", () => {
        it("should get languageTag from ApiError", () => {
            expect(getErrorMessage({ language: { languageTag: "language-tag" } })).toStrictEqual({
                language: "language-tag",
                displayText: undefined,
            });
        });

        it("should get displayText from ApiError", () => {
            expect(getErrorMessage({ language: { displayText: "display-text" } })).toStrictEqual({
                displayText: "display-text",
                language: undefined,
            });
        });

        it("should get null if ApiError lacks languageTag and displayText", () => {
            expect(getErrorMessage({ language: {} })).toBeNull();
        });

        it("should get null if ApiError lacks language", () => {
            expect(getErrorMessage({})).toBeNull();
        });

        it("should fallback to general server error message", () => {
            expect(getErrorMessage({ language: {} }, true)).toStrictEqual({
                language: "secondary.portal.beneficiaryList.serverError",
            });
            expect(getErrorMessage({}, true)).toStrictEqual({
                language: "secondary.portal.beneficiaryList.serverError",
            });
        });
    });
});
