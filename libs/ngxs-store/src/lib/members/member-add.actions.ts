/* eslint-disable max-classes-per-file */
export class AddMemberInfo {
    static readonly type = "[MemberAdd] AddMemberInfo";
    constructor(public payload: any) {}
}

export class AddMemberValidators {
    static readonly type = "[MemberAdd] AddMemberValidators";
    constructor(public payload: any) {}
}

export class SetMemberConfigurations {
    static readonly type: "[MemberAdd] SetMemberConfigurations";
    constructor(public payload: any[]) {}
}
