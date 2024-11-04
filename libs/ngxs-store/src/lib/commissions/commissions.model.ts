import { Situs } from "@empowered/api";
import { CompanyCode, AdminRoles } from "@empowered/constants";

export interface CommissionsModel {
    groupId: number;
    role: AdminRoles;
    situs: Situs;
    companyCode: CompanyCode;
    isDirect: boolean;
}
