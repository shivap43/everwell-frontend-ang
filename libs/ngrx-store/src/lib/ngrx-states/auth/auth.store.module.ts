import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";

import * as fromAuth from "./auth.reducer";
import { AuthEffects } from "./auth.effects";

@NgModule({
    declarations: [],
    imports: [CommonModule, StoreModule.forFeature(fromAuth.AUTH_FEATURE_KEY, fromAuth.reducer), EffectsModule.forFeature([AuthEffects])],
})
export class AuthStoreModule {}
