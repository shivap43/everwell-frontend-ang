import { Address } from "./api/address.model";

export interface AddressMatchModel {
    isDirect: boolean;
    isTPILnlAgentAssisted: boolean;
    isTPILnlSelfService: boolean;
    mpGroupId: number;
    memberId: number;
    address?: Address;
}
