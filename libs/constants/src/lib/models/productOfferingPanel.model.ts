import { SafeResourceUrl } from "@angular/platform-browser";
import { ProductType } from "../enums";
import { ProducerUnit } from "./api-service";
import { DisablePlanPanel } from "./disable-plan-panel.model";
import { MemberFlexDollar } from "./flex-dollar.model";
import { MemberQualifyingEvent } from "./member-qualifying-life-event.model";
import { PlanOfferingPanel } from "./planOfferingPanel.model";
import { ProductOffering } from "./productOffering.model";
import { Validity } from "./validity.model";

export interface ProductOfferingPanel extends ProductOffering {
    planOfferings?: PlanOfferingPanel[];
    enrollStatus?: string;
    productType?: ProductType;
    inCart?: boolean;
    declined?: boolean;
    companyProvided?: boolean;
    locked?: boolean;
    lockedBy?: string;
    disable?: DisablePlanPanel;
    genericDisable?: boolean;
    agentAssistanceRequired?: boolean;
    planYearId?: number;
    coverageDate?: string;
    defaultCoverageDate?: string;
    initialCoverageDate?: string;
    isAflac?: boolean;
    qualifyingEvents?: MemberQualifyingEvent[];
    planYearExist?: boolean;
    appliedDate?: boolean;
    flexDollars?: MemberFlexDollar[];
    icon?: SafeResourceUrl;
    selectedIcon?: SafeResourceUrl;
    minCoverageDate?: string;
    maxCoverageDate?: string;
    qleExist?: boolean;
    isAgPlanYear?: boolean;
    tppSelfServiceCoverageStartDate?: string;
    tppSentCoverageDateAvailable?: boolean;
    coverageDateGreater?: boolean;
    aflacGroupProduct?: boolean;
    multiplePlanYears?: boolean;
    newPlan?: boolean;
    multipleCoverageDateNew?: string;
    maxDays?: number;
    disableSTDProductForVCC?: boolean;
}

export interface PlanYearModel {
    id?: number;
    name?: string;
    enrollmentPeriod?: Validity;
    coveragePeriod?: Validity;
    coverageStartDateOption?: string;
    inForceFileDetails?: InForceFileDetailsModel;
}

export interface InForceFileDetailsModel {
    fileName?: string;
    uploadDate?: string | Date;
    uploadAdmin?: ProducerUnit;
}
