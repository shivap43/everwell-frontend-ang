import { AccountCallCenter } from "@empowered/api";
import { Exceptions, PlanChoice } from "@empowered/constants";

export interface EnrollmentOptionStateModel {
    pinSignatureExceptions: Exceptions[];
    planChoices: PlanChoice[];
    accountCallCenters: AccountCallCenter[];
    allowedExceptionTypes: string[];
}
