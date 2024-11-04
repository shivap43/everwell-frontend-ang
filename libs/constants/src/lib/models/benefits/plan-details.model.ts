import { CountryState } from "../api";

/* Plan data from benefits offering*/
export interface PlanDetailDialogData {
    planId: string;
    planName: string;
    states: CountryState[];
    mpGroup: number;
    carrierId?: number;
    riderIds?: [];
    displayRestrictions?: boolean;
    planOfferingId?: number;
    isRider?: boolean;
    channel?: string;
    productId?: number;
    isCarrierOfADV?: boolean;
    situsState?: string;
    referenceDate?: string;
}
