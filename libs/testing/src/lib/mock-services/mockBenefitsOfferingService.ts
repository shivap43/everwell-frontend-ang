import { of } from "rxjs";
import { BenefitOfferingSettingsInfo, DeletePlanChoice } from "@empowered/api";
import { ContiguousDates, PlanChoice, PlanYear } from "@empowered/constants";

export const mockBenefitsOfferingService = {
    setCoverageContiguousDates: (status: ContiguousDates) => {},
    getBenefitOfferingSettings: (mpGroup?: number) => of({} as BenefitOfferingSettingsInfo),
    getPlanChoices: (useUnapproved: boolean, includeRemovedPlans: boolean, mpGroup?: number, expand?: string) => of({}),
    createPlanChoice: (planchoice: PlanChoice, mpGroup: number) => of(void {}),
    updatePlanChoice: (planchoice: PlanChoice, mpGroup: number) => of(void {}),
    deletePlanChoice: (deletePlanChoice: DeletePlanChoice, choiceId: number, mpGroup: number, enrollmentEndDate?: string) => of(void {}),
    getApprovalRequests: (mpGroup: number) => of([]),
    updateArgusTotalEligibleEmployees: (argusTotalEligibleEmployees: string) => of(void {}),
    getPlanYears: (mpGroup: number, useUnapproved: boolean, inOpenEnrollment?: boolean, checkActiveEnrollments?: boolean) =>
        of([] as PlanYear[]),
    downloadCarrierForms: (mpGroup: number, carrierId: number) => of({}),
    createApprovalRequest: (mpGroup: number) => of(void {}),
};
