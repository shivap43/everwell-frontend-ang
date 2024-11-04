/* eslint-disable max-classes-per-file */

import { Situs } from "@empowered/api";
import { CompanyCode, AdminRoles } from "@empowered/constants";

export class SetCommissionsStateGroupId {
    static readonly type = "[Commissions] SetGroupId";
    constructor(public groupId: number) {}
}
export class SetRole {
    static readonly type = "[Commissions] SetRole";
    constructor(public role: AdminRoles) {}
}
export class SetSitus {
    static readonly type = "[Commissions] SetSitus";
    constructor(public situs: Situs) {}
}
export class SetCompanyCode {
    static readonly type = "[Commissions] SetCompanyCode";
    constructor(public companyCode: CompanyCode) {}
}
export class SetDirectData {
    static readonly type = "[Commissions] SetDirectData";
    constructor(public isDirect: boolean) {}
}
