import { MemberName } from "./memberName.model";

export interface MemberDetails {
    id: number;
    username: string;
    name: MemberName;
    consented: boolean;
    memberId: number;
    groupId: number;
}
