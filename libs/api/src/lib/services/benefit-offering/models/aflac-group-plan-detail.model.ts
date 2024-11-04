import { PlanChoice, Plan, TobaccoStatus, Document } from "@empowered/constants";
import { PriceOrRates } from "./price-rate-template.model";
import { MemberTypes } from "../..";

export interface AflacGroupPlanChoiceDetail {
    planChoice: PlanChoice;
    planDocument: Document;
}

export interface AflacGroupPlanPriceDetail {
    plan: Plan;
    aflacPlanId: number;
    productName: string;
    riders: AflacGroupPlanRider[];
    pricing: PriceOrRates[];
}

export interface AflacGroupPlanRider {
    planId: number;
    planName: string;
}

export interface AflacGroupPlanPriceDetailFilter {
    planId: number;
    memberMappings: AflacGroupPlanPriceMemberMapping[];
}

export interface AflacGroupPlanPriceMemberMapping {
    ageMaxOption: number;
    ageMinOption: number;
    memberType: MemberTypes;
    tobaccoStatusOptions: TobaccoStatus[];
}
