import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";

import * as fromPlanOfferings from "./plan-offerings.reducer";
import { PlanOfferingsEffects } from "./plan-offerings.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromPlanOfferings.PLAN_OFFERINGS_FEATURE_KEY, fromPlanOfferings.reducer),
        EffectsModule.forFeature([PlanOfferingsEffects]),
    ],
    providers: [PlanOfferingsEffects],
})
export class PlanOfferingsStoreModule {}
