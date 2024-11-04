import { TpiSSOModel, PlanOffering, MemberContact } from "@empowered/constants";
import { Carrier } from "@empowered/api";

export class TPIStateModel {
    tpiSSODetail: TpiSSOModel;
    planOffering: PlanOffering[];
    producerId: number;
    tpiShopRoute?: string;
    callCenterDisabilityEnrollmentRestricted?: boolean;
    allCarriers: Carrier[];
    userContactData: MemberContact;
    stateCode?: string;
}
