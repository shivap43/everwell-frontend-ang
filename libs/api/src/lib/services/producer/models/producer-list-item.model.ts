import { State } from "../../dashboard/models/state.model";
import { Name } from "@empowered/constants";
import { ACOOUNT_PRODUCER_ROLE } from "./../enums/account-producer-role.enum";

export interface ProducerListItem {
    id: number;
    name: Name;
    npn: string;
    writingNumbers: string[];
    licensedStates: string[];
    licenses: Licenses[];
    appointedCarrierIds: number[];
    carrierAppointments: any[];
    email?: string;
    hqSupport?: boolean;
    pendingInvite?: boolean;
    declinedInvite?: boolean;
    role: ACOOUNT_PRODUCER_ROLE;
}
interface Licenses {
    // eslint-disable-next-line id-denylist
    number: string;
    state: State;
    validity: Validity;
}

interface Validity {
    effectiveStarting: string;
}
