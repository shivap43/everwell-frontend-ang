import { ToAndFromModel } from "./to-and-from.model";

export interface DowngradeDisabilityRequestModel {
    decreaseMonthlyBenefitAmount?: ToAndFromModel;
    decreaseMaximumBenefitAmount?: ToAndFromModel;
    increaseEliminationPeriod?: ToAndFromModel;
}
