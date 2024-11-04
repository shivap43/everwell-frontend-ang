import { MemberName } from "./memberName.model";

export interface AgentSelfEnrollmentSSO {
    id: number;
    username: string;
    name: MemberName;
    consented: boolean;
    memberId: number;
    groupId: number;
    partnerId: number;
    lastLogin: string;
    producerId: number;
    agentLevel: number;
}
