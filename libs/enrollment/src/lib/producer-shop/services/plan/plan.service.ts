import { Injectable } from "@angular/core";
import { Characteristics, Plan } from "@empowered/constants";

@Injectable({
    providedIn: "root",
})
export class PlanService {
    /**
     * Return true if Plan is a Supplementary Plan. This means that the Plan has SUPPLEMENTARY characteristic
     * @param plan {Plan} Plan
     * @returns {boolean} boolean for if Plan is a Supplementary Plan
     */
    isSupplementaryPlan(plan: Plan): boolean {
        return plan?.characteristics?.includes(Characteristics.SUPPLEMENTARY) ?? false;
    }

    /**
     * Return true if Plan is a Stackable Plan. This means that the Plan has STACKABLE characteristic
     * @param plan {Plan} Plan
     * @returns {boolean} boolean for if Plan is a Stackable Plan
     */
    isStackablePlan(plan: Plan): boolean {
        return plan.characteristics?.includes(Characteristics.STACKABLE) ?? false;
    }
}
