/* eslint-disable max-classes-per-file */

export class LoadMemberBeneficiaries {
    static readonly type = "[MemberBeneficiaryList] Load Member Beneficiaries";
    constructor(public memberId: number, public MpGroup: number, public memberBeneficiaryId: number) {}
}

export class SetBeneficiariesMemberGroupId {
    static readonly type = "[MemberBeneficiaryList] SetBeneficiariesMemberGroupId";
    constructor(public groupId: number) {}
}

export class SetBeneficiariesMemberId {
    static readonly type = "[MemberBeneficiaryList] SetBeneficiariesMemberId";
    constructor(public memberId: number) {}
}

export class SetBeneficiaryId {
    static readonly type = "[MemberBeneficiaryList] SetMemberBeneficiaryId";
    constructor(public memberBeneficiaryId: number) {}
}

export class AddMemberBeneficiaryValidators {
    static readonly type = "[MemberBeneficiaryList] AddMemberBeneficiaryValidators";
    constructor(public payload: any) {}
}
