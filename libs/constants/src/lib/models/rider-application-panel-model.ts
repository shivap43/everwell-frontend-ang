import { ApplicationEnrollmentRequirements } from "./application.enrollment.restrictions.model";
import { CustomApplication } from "./custom-applications-model";
import { GetCartItems } from "./getCartItems.model";

export interface RiderApplicationPanel {
    appData: CustomApplication;
    cartData: GetCartItems;
    planId: number;
    baseRiderId?: number;
    planName: string;
    productId: number;
    productName: string;
    carrierId?: number;
    discard?: boolean;
    decline?: boolean;
    enrollmentRequirements?: ApplicationEnrollmentRequirements[];
    showRider?: boolean;
    cartItemId?: number;
    riderAttributeName?: string;
    riderPolicySeries?: string;
}
