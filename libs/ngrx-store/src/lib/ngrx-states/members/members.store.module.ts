import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";

import * as fromMembers from "./members.reducer";
import { MembersEffects } from "./members.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromMembers.MEMBERS_FEATURE_KEY, fromMembers.reducer),
        EffectsModule.forFeature([MembersEffects]),
    ],
    providers: [MembersEffects],
})
export class MembersStoreModule {}
