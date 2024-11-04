/* eslint-disable max-classes-per-file */

import { QuickQuotePlanDetails } from "@empowered/constants";
import { QuoteSettingsSchema } from "./universal-quote.model";

export class SetQuickQuotePlans {
    static readonly type = "[UniversalQuoteState] SetQuickQuotePlans";
    constructor(
        public state: string,
        public partnerAccountType: string,
        public payrollFrequency: string,
        public riskClass: string,
        public append?: QuickQuotePlanDetails[],
    ) {}
}

export class SetPlanPricing {
    static readonly type = "[UniversalQuoteState] SetPlanPricing";
    constructor(
        public planId: number,
        public genericSetting: QuoteSettingsSchema,
        public productId: number,
        public benefitAmount?: any[],
    ) {}
}
export class SetPlanCoverageLevels {
    static readonly type = "[UniversalQuoteState] SetPlanCoverageLevels";
    constructor(public planId: number, public productId: number) {}
}

export class SetAdminPreference {
    static readonly type = "[UniversalQuoteState] SetAdminPreference";
    constructor(public adminId: number) {}
}

export class SetQuoteLevelData {
    static readonly type = "[UniversalQuoteState] SetQuoteLevelData";
    constructor() {}
}
export class SavePlansPriceSelection {
    static readonly type = "[UniversalQuoteState] SavePlansPriceSelection";
    constructor(
        public planId: number,
        public productId: number,
        public selection: number,
        public choice: boolean,
        public riders?: any,
        public selectedEliminationPeriod?: Array<{ riderId: number; coverageId: number }>,
        // contains record of premiums selected for a dependent age/elimination period
        public multipleSelections?: Record<number, number>,
        public benefitAmountOptions?: number[],
        public isRiderApplyClicked?: boolean,
    ) {}
}

export class SetRestrictedConfiguration {
    static readonly type = "[UniversalQuoteState] SetRestrictedConfiguration";
    constructor() {}
}
export class SetQuoteLevelSetting {
    static readonly type = "[UniversalQuoteState] SetQuoteLevelSetting";
    constructor(public quoteSetting: QuoteSettingsSchema, public reset: boolean, public fromQuote?: boolean) {}
}
export class ResetQuoteLevelSettingZipCode {
    static readonly type = "[UniversalQuoteState] ResetQuoteLevelSettingZipCode";
    constructor() {}
}
export class RemovePlanPricing {
    static readonly type = "[UniversalQuoteState] RemovePlanPricing";
    constructor() {}
}
export class RemoveSelections {
    static readonly type = "[UniversalQuoteState] RemoveSelections";
    constructor() {}
}

/**
 * Saves whether a given plan is selected to be included in the rate sheet.
 */
export class SaveRateSheetSelection {
    static readonly type = "[UniversalQuoteState] SaveRateSheetSelection";
    constructor(readonly planId: number, readonly productId: number, readonly add: boolean) {}
}
