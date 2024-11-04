import { CarrierSetupStatus } from "@empowered/api";
import { AccountCarrier } from "@empowered/constants";

export interface CarrierData {
    carrier: AccountCarrier;
    carrierForms: CarrierSetupStatus[];
    carrierFormNames: string[];
    signatureRequired: boolean;
    viewOnly: boolean;
    documentViewed: boolean;
    isVAS?: boolean;
    isQ60?: boolean;
    vasContentTag?: string;
    planName: string;
}
