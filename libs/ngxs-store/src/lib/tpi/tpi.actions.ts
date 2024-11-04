/* eslint-disable max-classes-per-file */

import { TpiSSOModel, PlanOffering, MemberContact } from "@empowered/constants";

export class SetTPISSODetail {
    static readonly type = "[TPI] SetTPISSODetail";
    constructor(public tpiSSODetail: TpiSSOModel) {}
}
export class SetOfferingState {
    static readonly type = "[TPIOfferingProduct] SetOfferingState";
    constructor(public planOffering: PlanOffering[]) {}
}

export class SetTPIProducerId {
    static readonly type = "[TPIStateModel] SetTPIProducerId";
    constructor(public producerId: number) {}
}

export class SetTPILegalEntityBasedOnState {
    static readonly type = "[TPIStateModel] SetTPILegalEntityBasedOnState";
    constructor(public stateCode: string) {}
}

export class SetTPIShopRoute {
    static readonly type = "[TPIStateModel] SetTPIShopRoute";
    constructor(public tpiShopRoute: string) {}
}

/**
 * Sets whether restriction on disability enrollment for call centers is enabled.
 */
export class SetDisabilityEnrollmentRestriction {
    static readonly type = "[TPIStateModel] SetDisabilityEnrollmentRestriction";
    constructor(public callCenterDisabilityEnrollmentRestricted: boolean) {}
}

export class SetAllCarriersTPI {
    static readonly type = "[TPIStateModel] SetAllCarriersTPI";

    constructor(public stateCode: string) {}
}
export class SetUserContactData {
    static readonly type = "[TPIStateModel] SetUserContactData";

    constructor(public userContactData: MemberContact) {}
}
