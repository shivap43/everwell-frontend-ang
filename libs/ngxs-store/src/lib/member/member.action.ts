/* eslint-disable max-classes-per-file */

export class AddMpGroup {
    static readonly type = "[Member] MpGroup";
    constructor(public mpGroup: number) {}
}

export class AddMemberId {
    static readonly type = "[Member] MemberId";
    constructor(public memberId: number) {}
}

export class AddBeneficiaryValidators {
    static readonly type = "[Member] AddValidators";
    constructor(public payload: any) {}
}
