import { ToAndFromModel } from "./to-and-from.model";

export interface DowngradeAccidentRequestModel {
    decreaseMonthlyBenefitAmount?: ToAndFromModel;
    decreaseMaximumBenefitAmount?: ToAndFromModel;
    increaseEliminationPeriod?: ToAndFromModel;
    decreasedRider?: ToAndFromModel;
}
