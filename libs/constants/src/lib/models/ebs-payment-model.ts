import { EbsPaymentOnFileEnum } from "../enums";

export interface EBS_Payment {
    isEBSAccount: boolean;
    steps?: any[];
}

export interface EbsPaymentFile {
    EbsPaymentOnFileEnum: boolean;
}

export interface EbsPaymentFileEnrollment {
    enrollmentIds: number[];
    ebsPaymentOnFile: EbsPaymentOnFileEnum;
}

export type EbsPaymentRecord = Record<EbsPaymentOnFileEnum, boolean>;
