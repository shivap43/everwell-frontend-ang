import { PlanOfferingPanel } from "./planOfferingPanel.model";

export interface BuyUpOptions {
    show: boolean;
    childPlanId: number;
    disableOptions?: boolean;
    buyUpParentPlan?: PlanOfferingPanel;
}
