import { Accounts } from "./account.model";
import { DualRiskClass } from "./dual-risk-class-model";
import { MemberContact } from "./member-contact.model";
import { MemberProfile } from "./member-profile.model";
import { Salary } from "./member-salary.model";

export interface MemberData {
    info: MemberProfile;
    salaryInfo?: Salary[];
    contactInfo?: MemberContact[];
    riskClassId?: number;
    account?: Accounts;
    dualRiskClasses?: DualRiskClass[];
}
