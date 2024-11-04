import { ArgusCarrierRestriction } from "./argus-carrier-restriction.model";

export interface ArgusCarrier {
    stateName: string;
    restrictions: ArgusCarrierRestriction[];
}
