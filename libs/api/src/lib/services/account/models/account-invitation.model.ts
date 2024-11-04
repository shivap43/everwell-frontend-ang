import { Assignment } from "../../aflac";
import { ROLE } from "@empowered/constants";

export interface AccountInvitation {
    invitedProducerIds: number[];
    message: string;
    commissionSplitAssignments?: Assignment[];
    proposedRole?: ROLE;
}
