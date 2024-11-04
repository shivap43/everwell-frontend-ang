import { Enrollments, PlanOffering } from "@empowered/constants";
import { of } from "rxjs";

export const mockProducerShopHelperService = {
    getSelectedEnrollment: (planOffering: PlanOffering) => of({}),
    inOpenEnrollment: () => of(false),
    isOEAndEnrollmentDueToExpire: (enrollment: Enrollments, inOpenEnrollment: boolean) => false,
};
