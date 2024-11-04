import { AccountProducer } from "@empowered/constants";
import { ACOOUNT_PRODUCER_ROLE } from "../enums";
import { ProducerAccount } from "./account.model";

export interface ReceivedAccountInvitation {
    account: ProducerAccount;
    invitingProducer: AccountProducer;
    proposedRole: ACOOUNT_PRODUCER_ROLE;
    message: string;
}
