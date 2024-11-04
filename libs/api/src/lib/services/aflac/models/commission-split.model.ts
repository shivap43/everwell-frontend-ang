import { CompanyCode, EnrollmentMethod } from "@empowered/constants";

export interface CommissionSplit {
    id?: number;
    name?: string;
    defaultFor?: DefaultFor;
    assignments: Assignment[];
    rules: Rule[];
    expandedView?: boolean;
    isDefault?: boolean;
    isPartnerCarrierSplit?: boolean;
    defaultSplit?: Split;
    customSplit?: Split;
    disablePartnerCarrierSplit?: boolean;
    splitCompanyCode?: string;
    createdById?: number;
    conversion: boolean;
    repairRequired?: boolean;
    orphaned?: boolean;
    enrollmentState?: CompanyCode;
    archived?: boolean;
}
export interface CommissionSplitOperation {
    index?: number;
    operation: string;
}
interface Split {
    edit?: boolean;
    remove?: boolean;
    view?: boolean;
}
export interface DefaultFor {
    producerId: number;
    name?: string;
}
export interface Assignment {
    producer?: DefaultFor;
    sitCodeId: number;
    percent: number;
}

export interface CommonRule {
    id?: number;
    type?: string;
    name?: string;
    carrierId?: number;
}

interface Written {
    effectiveStarting: Date | string;
    expiresAfter?: Date | string;
}

type WritingProducerRule = CommonRule & DefaultFor;

interface ProductRule extends CommonRule {
    productId: number;
    name?: string;
}

interface StatesRule extends CommonRule {
    states: string[];
}

interface DateWrittenRule extends CommonRule {
    written: Written;
}

interface CarrierRule extends CommonRule {
    carrierId: number;
    name?: string;
}

interface EnrollmentMethodRule extends CommonRule {
    enrollmentMethod: string | EnrollmentMethod;
}

export interface Rule extends CommonRule {
    producerId?: number;
    productId?: number;
    name?: string;
    effectiveStarting?: Date | string;
    expiresAfter?: Date | string;
    written?: Written;
    states?: string[];
    carrierId?: number;
    enrollmentMethod?: string | EnrollmentMethod;
}
