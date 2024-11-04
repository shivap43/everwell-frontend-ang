import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";

import * as fromAccounts from "./accounts.reducer";
import { AccountsEffects } from "./accounts.effects";

@NgModule({
    imports: [
        CommonModule,
        StoreModule.forFeature(fromAccounts.ACCOUNTS_FEATURE_KEY, fromAccounts.reducer),
        EffectsModule.forFeature([AccountsEffects]),
    ],
    providers: [AccountsEffects],
})
export class AccountsStoreModule {}
