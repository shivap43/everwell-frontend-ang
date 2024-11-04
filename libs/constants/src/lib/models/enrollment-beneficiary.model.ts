import { MemberBeneficiary } from "./member-benficiary.model";

export interface EnrollmentBeneficiary {
    beneficiaryId?: number;
    beneficiary?: MemberBeneficiary;
    allocationType: "PRIMARY" | "SECONDARY";
    percent: number;
}
