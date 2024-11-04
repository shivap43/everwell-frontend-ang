/* eslint-disable max-classes-per-file */

export class UpdateInput {
    static readonly type = "[Input] UpdateInput";

    constructor(public formName: string, public error: boolean, public domOrder: string, public id: string) {}
}

export class InputResetState {
    static readonly type = "[User] ResetState";
}
