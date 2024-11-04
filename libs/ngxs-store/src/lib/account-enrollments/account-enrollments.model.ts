import { BusinessEnrollments } from "@empowered/api";
import { SITCode } from "@empowered/constants";

export interface Business {
    configurations: any;
    mpGroupId: string;
    activeMemberId: string;
    unsentEnrollments: BusinessEnrollments[];
    sentEnrollments: BusinessEnrollments[];
    commissionList: any[];
    sitCodes: SITCode[];
    isDirect: boolean;
}
