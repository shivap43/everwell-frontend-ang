import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { RateSheetsEffects } from "./rate-sheets.effects";

import * as fromRateSheets from "./rate-sheets.reducer";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromRateSheets.RATE_SHEETS_FEATURE_KEY, fromRateSheets.reducer),
        EffectsModule.forFeature([RateSheetsEffects]),
    ],
})
export class RateSheetsStoreModule {}
