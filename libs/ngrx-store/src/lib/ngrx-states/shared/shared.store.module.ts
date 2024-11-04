import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";

import * as fromShared from "./shared.reducer";
import { SharedEffects } from "./shared.effects";

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        StoreModule.forFeature(fromShared.SHARED_FEATURE_KEY, fromShared.reducer),
        EffectsModule.forFeature([SharedEffects]),
    ],
})
export class SharedStoreModule {}
