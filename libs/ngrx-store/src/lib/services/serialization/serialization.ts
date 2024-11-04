/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L4)
 * Check if target is undefined
 *
 * @param target {unknown} any possible value
 * @returns {boolean} true if target is undefined
 */
export function isUndefined(target: unknown): target is undefined {
    return target === undefined;
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L8)
 * Check if target is null
 *
 * @param target {unknown} any possible value
 * @returns {boolean} true if target is null
 */
export function isNull(target: unknown): target is null {
    return target === null;
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L12)
 * Check if target is an Array
 *
 * @param target {unknown} any possible value
 * @returns {boolean} true if target is an Array
 */
export function isArray(target: unknown): target is Array<any> {
    return Array.isArray(target);
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L16)
 * Check if target is string
 *
 * @param target {unknown} any possible value
 * @returns {boolean} true if target is string
 */
export function isString(target: unknown): target is string {
    return typeof target === "string";
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L20)
 * Check if target is boolean
 *
 * @param target {unknown} any possible value
 * @returns {boolean} true if target is boolean
 */
export function isBoolean(target: unknown): target is boolean {
    return typeof target === "boolean";
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L24)
 * Check if target is number
 *
 * @param target {unknown} any possible value
 * @returns {boolean} true if target is number
 */
export function isNumber(target: unknown): target is number {
    return typeof target === "number";
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L28)
 * Check if target is object like
 *
 * @param target {unknown} any possible value
 * @returns true if target is object like
 */
export function isObjectLike(target: unknown): target is object {
    return typeof target === "object" && target !== null;
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L32)
 * Check if target is object
 *
 * @param target {unknown} any possible value
 * @returns true if target is object
 */
export function isObject(target: unknown): target is object {
    return isObjectLike(target) && !isArray(target);
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L36)
 * Check if target is a plain object
 *
 * @param target {unknown} any possible value
 * @returns true if target is a plain object
 */
export function isPlainObject(target: unknown): target is object {
    if (!isObject(target)) {
        return false;
    }

    const targetPrototype = Object.getPrototypeOf(target);
    return targetPrototype === Object.prototype || targetPrototype === null;
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L45)
 * Check if target is a function
 *
 * @param target {unknown} any possible value
 * @returns return if target is a function
 */
export function isFunction(target: unknown): target is () => void {
    return typeof target === "function";
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L49)
 * Check if target is an Angular Component
 *
 * @param target {unknown} any possible value
 * @returns true if target is an Angular Component
 */
export function isComponent(target: unknown) {
    // eslint-disable-next-line no-prototype-builtins
    return isFunction(target) && target.hasOwnProperty("ɵcmp");
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts#L53)
 * Check if target has property
 *
 * @param target {unknown} any possible value
 * @param propertyName {string} property name of target
 * @returns true if target has property
 */
export function hasOwnProperty(target: object, propertyName: string): boolean {
    return Object.prototype.hasOwnProperty.call(target, propertyName);
}

/**
 * [source](https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/serialization_reducer.ts#L35)
 *
 * [serializable constraints on NGRX actions](https://ngrx.io/guide/store/configuration/runtime-checks#strictactionserializability)
 *
 * Check if target NGRX state is not serializable. Any simple object can be an "NGRX state"
 *
 * If you want to test if some instance is serializable, wrap it in an object to simulate it being in an NGRX state
 *
 * @param target {unknown} any possible NGRX state
 * @param path {string[]} property path of target
 * @returns {boolean} true if target is not serializable
 */
export function getUnserializable(target?: unknown, path: string[] = []): false | { path: string[]; value: unknown } {
    // Guard against undefined and null, e.g. a reducer that returns undefined
    if ((isUndefined(target) || isNull(target)) && path.length === 0) {
        return {
            path: ["root"],
            value: target,
        };
    }

    // Safe to type assert anything as object since `Object.keys` always returns empty Array if not an object
    const keys = Object.keys(target as object);
    return keys.reduce<false | { path: string[]; value: unknown }>((result, key) => {
        if (result) {
            return result;
        }

        const value = (target as any)[key];

        // Ignore Ivy components
        if (isComponent(value)) {
            return result;
        }

        if (isUndefined(value) || isNull(value) || isNumber(value) || isBoolean(value) || isString(value) || isArray(value)) {
            return false;
        }

        if (isPlainObject(value)) {
            return getUnserializable(value, [...path, key]);
        }

        return {
            path: [...path, key],
            value,
        };
    }, false);
}
