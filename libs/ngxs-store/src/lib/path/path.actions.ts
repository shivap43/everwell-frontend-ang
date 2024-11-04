/* eslint-disable max-classes-per-file */

const ACTION_PREFIX = "[AppState]";

export class ResetToParameters {
    static readonly type: string = `${ACTION_PREFIX} ResetToParameters`;

    /**
     * Action to override the current parameters with the new set
     *
     * @param parameters new map of path parameters
     */
    constructor(public parameters: unknown) {}
}

export class AddPathParameter {
    static readonly type: string = `${ACTION_PREFIX} AddPathParameter`;

    /**
     * Action used to add a Path Parameter to the store
     *
     * @param name Name of the path variable (ex: mpGroupId)
     * @param id The value of the path variable (id)
     * @param value Optional value override, allows manual calls to override the path parameter
     */
    constructor(public name: string, public id: string, public value?: any) {}
}
