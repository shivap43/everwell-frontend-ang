import { CompanyCode } from "./../enums/company-code.enum";

export interface SITCode {
    id: number;
    code: string;
    companyCode?: CompanyCode;
    expirationDate?: string;
    active?: boolean;
}
