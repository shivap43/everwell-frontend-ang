import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { AccountDetailComponent } from "./account-detail.component";
import { ACCOUNT_DETAIL_ROUTES } from "./account-detail.routes";
import { ReportsModule } from "@empowered/reports";

@NgModule({
    declarations: [AccountDetailComponent],
    imports: [RouterModule.forChild(ACCOUNT_DETAIL_ROUTES), SharedModule, ReportsModule],
})
export class AccountDetailModule {}
