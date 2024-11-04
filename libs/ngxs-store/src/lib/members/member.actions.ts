/* eslint-disable max-classes-per-file */
import { MemberProfile } from "@empowered/constants";

export class GetMember {
    static readonly type = "[Member API] GetMember";
    constructor(public memberId: MemberProfile["id"], public fullProfile: boolean = false, public mpGroup: string) {}
}

export class UpdateMember {
    static readonly type = "[Member API] UpdateMember";
    constructor(public addMemberModel: MemberProfile, public MpGroup: string, public stateMemberId?: string) {}
}
