import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { AccountListState } from "./account-list.state";

@NgModule({
    imports: [NgxsModule.forFeature([AccountListState])],
})
export class AccountListNgxsStoreModule {}
