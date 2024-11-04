import { ApplicationEnrollmentRequirements } from "./application.enrollment.restrictions.model";
import { CustomApplication } from "./custom-applications-model";
import { GetCartItems } from "./getCartItems.model";
import { RiderApplicationPanel } from "./rider-application-panel-model";

export interface BasePlanApplicationPanel {
    appData: CustomApplication;
    cartData: GetCartItems;
    planId: number;
    planName: string;
    productId: number;
    productName: string;
    riders?: RiderApplicationPanel[];
    carrierId?: number;
    characteristics?: string[];
    baseRiderId?: number;
    enrollmentRequirements?: ApplicationEnrollmentRequirements[];
    cartItemId?: number;
    isAdditionalUnit?: boolean;
    riderPolicySeries?: string;
}
