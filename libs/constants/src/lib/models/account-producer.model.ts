import { ROLE } from "./../enums/role.enum";
import { ProducerDetails } from "./producer.model";

export interface AccountProducer {
    producer: ProducerDetails;
    role: ROLE;
    pendingInvite: boolean;
}
