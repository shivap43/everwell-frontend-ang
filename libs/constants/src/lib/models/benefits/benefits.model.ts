import { CountryState } from "../api/state.model";
import { PlanChoice } from "../api-service";
import { Carrier } from "../api/carrier.model";
import { Plan, PlansEligibility } from "../api/plan.model";
import { ProductSelection } from "../api/product-selection.model";
import { Product } from "../api";

export interface PlanPanelModel {
    plan: Plan;
    planChoice: PlanChoice;
    states: CountryState[];
    planEligibilty: PlansEligibility;
}

export interface PanelModel {
    product: Product;
    carrier: Carrier[];
    individualEligibility: boolean;
    groupEligibility: boolean;
    productChoice?: ProductSelection;
    plans?: PlanPanelModel[];
}
