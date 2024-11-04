/* eslint-disable max-classes-per-file */

import { BUSINESS_ENROLLMENT_TYPE } from "@empowered/api";

export class AddEnrollments {
    static readonly type = "[Business] AddEnrollments";
    constructor(public payload: any, type: BUSINESS_ENROLLMENT_TYPE) {}
}

export class AddValidators {
    static readonly type = "[Business] AddValidators";
    constructor(public payload: any) {}
}

export class SetConfigurations {
    static readonly type: "[Business] SetConfigurations";
    constructor(public payload: any[]) {}
}
export class SetDirect {
    static readonly type = "[Business] SetDirect";
    constructor(public isDirect: boolean) {}
}
