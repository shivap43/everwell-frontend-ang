import { Component } from "@angular/core";
import { ApiError } from "@empowered/constants";
import {
    getUnserializable,
    hasOwnProperty,
    isArray,
    isBoolean,
    isComponent,
    isFunction,
    isNull,
    isNumber,
    isObjectLike,
    isPlainObject,
    isUndefined,
} from "./serialization";

@Component({
    template: "",
})
class TestComponent {}

describe("serialization", () => {
    describe("isUndefined()", () => {
        it("should return true if target is undefined", () => {
            expect(isUndefined(undefined)).toBe(true);
        });
    });

    describe("isNull()", () => {
        it("should return true if target is null", () => {
            expect(isNull(null)).toBe(true);
        });
    });

    describe("isArray()", () => {
        it("should return true if target is Array", () => {
            expect(isArray([])).toBe(true);
        });
    });

    describe("isBoolean()", () => {
        it("should return true if target is boolean", () => {
            expect(isBoolean(false)).toBe(true);
        });
    });

    describe("isNumber()", () => {
        it("should return true if target is number", () => {
            expect(isNumber(9)).toBe(true);
        });
    });

    describe("isObjectLike()", () => {
        it("should return true if target is object-like", () => {
            expect(isObjectLike({})).toBe(true);
        });

        it("should return false if target is NOT object-like", () => {
            expect(isObjectLike(null)).toBe(false);
        });
    });

    describe("isPlainObject()", () => {
        it("should return true if target is plain object", () => {
            expect(isPlainObject(Object.create(null))).toBe(true);
        });
    });

    describe("isFunction()", () => {
        it("should return true if target is function", () => {
            expect(isFunction(() => {})).toBe(true);
        });
    });

    describe("hasOwnProperty()", () => {
        it("should return true if target has property", () => {
            expect(hasOwnProperty({ moo: "cow" }, "moo")).toBe(true);
            expect(hasOwnProperty({ moo: "cow" }, "cow")).toBe(false);
        });
    });

    describe("getUnserializable()", () => {
        it("should return path to root if state is undefined", () => {
            expect(getUnserializable(undefined)).toStrictEqual({ path: ["root"], value: undefined });
        });

        it("should return path to root if state is null", () => {
            expect(getUnserializable(null)).toStrictEqual({ path: ["root"], value: null });
        });

        it("should return path to Error instance", () => {
            const mock = { state: new Error() };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Error class", () => {
            const mock = { state: Error };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Map instance", () => {
            const mock = { state: new Map() };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Map class", () => {
            const mock = { state: Map };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Date instance", () => {
            const mock = { state: new Date() };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Date class", () => {
            const mock = { state: Date };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Event instance", () => {
            const mock = { state: new Event("test") };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Event class", () => {
            const mock = { state: Event };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return path to Event component", () => {
            const mock = { state: TestComponent };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: mock.state });
        });

        it("should return state wraps a ApiError", () => {
            const mock = {
                state: {
                    message: "Some error message",
                    language: {
                        languageTag: "some language tag",
                        displayText: "some display text",
                    },
                } as ApiError,
            };

            expect(getUnserializable(mock)).toBe(false);
        });

        it("should return path to unserialiable instance in state even if part of state is serializable", () => {
            const mock = { state: Event, this_path: { is: { serializable: true } } };
            expect(getUnserializable(mock)).toStrictEqual({ path: ["state"], value: Event });
        });
    });
});
