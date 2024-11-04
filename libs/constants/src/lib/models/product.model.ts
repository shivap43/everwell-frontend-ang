import { Plan } from "./api";

export interface Product {
    id: number;
    name: string;
    adminName?: string;
    displayOrder?: number;
    valueAddedService?: boolean;
    description?: string;
    carrierName?: string;
    legalName?: string;
    carrierIds?: number[];
    iconLocation?: string;
    iconSelectedLocation?: string;
    cardColorCode?: string;
    productId?: number;
}

export interface ProductDetails {
    approvalStatus: string;
    carrierId: number;
    carrierName: string;
    isAllPlansDeactivated: number;
    isRemoveAllPlans: boolean;
    planLowAlert: boolean;
    planLowAlertTooltip: boolean;
    planYear: string;
    planYearCount: string;
    planYearToolTip: string;
    planYears: number;
    plans: Plan[];
    plansCount: number;
    policyOwnershipType: string;
    productHighAlert: boolean;
    productName: string;
    notEligible: boolean;
}
