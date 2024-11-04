/* eslint-disable max-classes-per-file */

import { PlanChoice } from "@empowered/constants";

export class SetPINSignatureExceptions {
    static readonly type = "[EnrollmentOptionsState] Set Pin Signature Exceptions";
    constructor(public mpGroup: number) {}
}
export class SetAccountCallCenters {
    static readonly type = "[EnrollmentOptionsState] Set Account Call Centers";
    constructor(public mpGroup: number, public expand: string) {}
}

export class SetAllowedExceptionTypes {
    static readonly type = "[EnrollmentOptionsState] Set Allowed Exception Types";
    constructor() {}
}

export class SetOfferingPlanChoices {
    static readonly type = "[EnrollmentOptionsState] Set Benefits Offering Plan Choices";
    constructor(public planChoices: PlanChoice[]) {}
}
export class ResetEnrollmentOptions {
    static readonly type = "[EnrollmentOptionsState] Reset Enrollment Options State";
    constructor() {}
}
