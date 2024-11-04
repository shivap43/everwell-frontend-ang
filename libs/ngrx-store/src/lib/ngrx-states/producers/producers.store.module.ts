import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";

import * as fromProducers from "./producers.reducer";
import { ProducersEffects } from "./producers.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromProducers.PRODUCERS_FEATURE_KEY, fromProducers.reducer),
        EffectsModule.forFeature([ProducersEffects]),
    ],
    providers: [ProducersEffects],
})
export class ProducersStoreModule {}
