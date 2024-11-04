import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";

import * as fromEnrollments from "./enrollments.reducer";
import { EnrollmentsEffects } from "./enrollments.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromEnrollments.ENROLLMENTS_FEATURE_KEY, fromEnrollments.reducer),
        EffectsModule.forFeature([EnrollmentsEffects]),
    ],
})
export class EnrollmentsStoreModule {}
