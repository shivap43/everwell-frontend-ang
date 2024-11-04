import { MemberProfile } from "@empowered/constants";

export interface Member {
    activeMemberId: number;
    memberInfo: MemberProfile;
    errorMessage?: string;
    configurations: any;
    mpGroupId: string;
}
