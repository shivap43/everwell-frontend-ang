import { RoleType } from "../../enums";
import { ActionRequired } from "./../../enums/api/action-required.enum";
import { Name } from "./../name.model";

export type Credential = AdminCredential | MemberCredential | ProducerCredential;

/**
 * @private
 */
interface BaseCredential {
    id?: number;
    username?: string;
    name?: Name;
    consented?: boolean;
    actionRequired?: ActionRequired[];
    isPendingEnrollments?: boolean;
    partnerId?: number;
    authCode?: number;
}

export interface AdminCredential extends BaseCredential {
    adminId: number;
    tpa?: boolean;
    /**
     * may be null if a third party administrator
     */
    groupId?: number;
}

export interface MemberCredential extends BaseCredential {
    memberId?: number;
    groupId?: number;
    // Because MemberCredential are often combined with AdminCredential and ProducerCredential interface,
    // we can avoid type errors when checking for adminId by specifying that it never exists on MemberCredential
    adminId?: never;
}

export interface ProducerCredential extends BaseCredential {
    producerId?: number;
    callCenterId?: number;
    adminId?: number;
    groupId?: number;
    caseBuilderId?: number;
    role?: string;
}

export type CredentialType = "MEMBER" | "PRODUCER" | "ADMIN";

export function GET_CREDENTIAL_TYPE(credential: Credential): CredentialType {
    if ("producerId" in credential) {
        return "PRODUCER";
    }

    if ("adminId" in credential && !("memberId" in credential)) {
        return "ADMIN";
    }

    return "MEMBER";
}
