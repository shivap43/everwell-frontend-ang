/* eslint-disable max-classes-per-file */
import { Permission } from "./dashboard.model";
export class AddAccountInfo {
    static readonly type = "[Account] AddAccountInfo";
    constructor(public payload: any) {}
}
export class HasPermissionToAccount {
    static readonly type = "[Permission] check permission to account";
    constructor(public payload: Permission) {}
}
