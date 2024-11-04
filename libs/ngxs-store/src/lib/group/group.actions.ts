import { BaseAction } from "../requests/request-actions";

/**
 * Used to add or update a field in the group state based on what state it came from and what action was dispatched
 */
export class UpdateGroupState implements GroupAction {
    static readonly type: string = "[GroupState] UpdateGroupState";

    constructor(readonly groupId: number, readonly actionType: BaseAction, readonly fieldValue: any) {}
}

export interface GroupAction {
    groupId: number;
}
