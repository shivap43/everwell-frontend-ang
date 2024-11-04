import { ArgusCarrier } from "./argus-carrier.model";

export interface ArgusCarrierRestriction {
    minEmployees: number;
    maxEmployees: number;
    allowedPlans: number;
}

export interface ArgusConfigTier {
    visionCarrierMaps: ArgusCarrier[];
    dentalCarrierMaps: ArgusCarrier[];
    dentalPlansTier1All: number[];
    dentalPlansTier2All: number[];
    dentalPlansTier1PPO: number[];
    dentalPlansTier1MAC: number[];
    dentalPlansTier2PPO: number[];
    dentalPlansTier2MAC: number[];
    dentalPlansTier1PPOER: number[];
    dentalPlansTier1MACER: number[];
    dentalPlansTier2PPOER: number[];
    dentalPlansTier2MACER: number[];
    dentalPlansTier1FLPPO: number[];
    dentalPlansTier1FLMAC: number[];
    dentalPlansTier2FLPPO: number[];
    dentalPlansTier2FLMAC: number[];
    dentalPlansTier1FLPPOER: number[];
    dentalPlansTier1FLMACER: number[];
    dentalPlansTier2FLPPOER: number[];
    dentalPlansTier2FLMACER: number[];
    dentalPlansFLDHMO: number[];
    visionPlansTier1EP: number[];
    visionPlansTier2EP: number[];
    visionPlansTier1ER: number[];
    visionPlansTier2ER: number[];
    dentalPlansTier1Fl: number[];
    dentalPlansTier2Fl: number[];
}
