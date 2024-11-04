import "jest-preset-angular/setup-jest";

// Suppress ngxs warning about not running in dev mode when in TestMode
jest.mock("@ngxs/store/internals", () => ({
    ...(jest.requireActual("@ngxs/store/internals") as any),
    isAngularInTestMode: () => true,
}));

// Support for ClipboardEvent is currently only offically supported by Firefox:
// source: https://stackoverflow.com/questions/23238236/using-the-clipboard-api-throws-error-is-not-defined
// source: https://caniuse.com/clipboard

// Provide a stub for ClipBoardEvent
Object.defineProperty(window, "ClipboardEvent", {
    writable: true,
    value: () => {},
});

// Provide a mock for localStorage
const localStorageMock = (function (): WindowLocalStorage["localStorage"] {
    let localStore: { [key: string]: string } = {};

    return {
        getItem: function (key: string): string | null {
            return localStore[key] ?? null;
        },
        setItem: function (key: string, value: string): void {
            localStore[key] = value.toString();
        },
        clear: function (): void {
            localStore = {};
        },
        removeItem: function (key: string): void {
            delete localStore[key];
        },
        get length(): number {
            return Object.keys(localStore).length;
        },
        key: function (index: number): string | null {
            return Object.keys(localStore)[index] ?? null;
        },
    };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
