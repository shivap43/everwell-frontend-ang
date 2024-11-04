import { CompanyCodeDescription } from "./company-code-description.model";

export interface ResolvedPremium {
    issuedToday: number;
    closed: number;
    declined: number;
    issuedYesterday: number;
    notTaken: number;
    postponed: number;
    withdrawn: number;
    company: CompanyCodeDescription;
}
