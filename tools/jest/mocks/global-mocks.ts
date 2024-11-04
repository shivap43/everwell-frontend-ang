/**
 * Jest initial setup actions
 *
 * It also enables the following to all Jest tests
 *  . window.localStorage
 *  . window.sessionStorage
 *  . window.getComputedStyle
 *  . document.doctype
 *  . document.body.style.transform
 *  . MockPipe()
 *  . MockComponent()
 *  . MockDirective()
 */
import { Component, Directive, EventEmitter, Pipe, PipeTransform } from "@angular/core";
import "jest-preset-angular/setup-jest";

Error.stackTraceLimit = 2;

global["CSS"] = undefined;

const mock = () => {
    let storage = {};

    return {
        getItem: (key) => (key in storage ? storage[key] : undefined),
        setItem: (key, value) => (storage[key] = value || ""),
        removeItem: (key) => delete storage[key],
        clear: () => (storage = {}),
    };
};

Object.defineProperty(window, "localStorage", { value: mock() });

Object.defineProperty(window, "sessionStorage", { value: mock() });

Object.defineProperty(document, "doctype", {
    value: "<!DOCTYPE html>",
});

Object.defineProperty(window, "getComputedStyle", {
    value: () => {
        return {
            display: "none",
            appearance: ["-webkit-appearance"],
        };
    },
});

/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JSDOM missing transform property
 */
Object.defineProperty(document.body.style, "transform", {
    value: () => {
        return {
            enumerable: true,
            configurable: true,
        };
    },
});

/**
 * Examples:
 * MockPipe('some-pipe');
 * MockPipe('some-pipe', () => 'foo');
 */
export function MockPipe(name: string, transform?: any): Pipe {
    class Mock implements PipeTransform {
        transform = transform || (() => undefined);
    }

    return Pipe({ name })(Mock as any);
}
