import { SearchHeaderModel } from "./member-list.model";

export class LoadMembers {
    static readonly type = "[MemberList] Load Members";
    constructor(public payload: string, public searchHeaderObj: SearchHeaderModel) {}
}
