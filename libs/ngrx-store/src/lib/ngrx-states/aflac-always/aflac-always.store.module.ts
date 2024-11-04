import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { StoreModule } from "@ngrx/store";
import * as fromAflacAlways from "./aflac-always.reducer";
import { EffectsModule } from "@ngrx/effects";
import { AflacAlwaysEffects } from "./aflac-always.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromAflacAlways.AFLAC_ALWAYS_FEATURE_KEY, fromAflacAlways.reducer),
        EffectsModule.forFeature([AflacAlwaysEffects]),
    ],
})
export class AflacAlwaysStoreModule {}
