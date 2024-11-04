import { CompanyCodeDescription } from "./company-code-description.model";

export interface PendedPremium {
    delayBillConversions: number;
    issuedToday: number;
    newlyTransmitted: number;
    pendedConversions: number;
    pendedNewBusiness: number;
    company: CompanyCodeDescription;
}
