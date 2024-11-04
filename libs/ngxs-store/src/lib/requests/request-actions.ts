/* eslint-disable max-classes-per-file */

export class UpdateStateAction {
    static readonly type: string = "[RequestState] updateStateAction";

    constructor(public actionType: BaseAction, public action: any) {}
}

export class ExpireAction {
    static readonly type: string = "[RequestState] expireAction";

    constructor(public actionType: BaseAction, public action: any) {}
}

export class ExpireActions {
    static readonly type: string = "[RequestState] expireActions";

    constructor(public expireMatching: (action: any) => boolean, public actionType?: BaseAction) {}
}

export interface BaseAction {
    type: string;
}
