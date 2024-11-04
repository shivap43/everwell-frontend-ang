import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MemberBenefitDollarsRoutingModule } from "./member-benefit-dollars-routing.module";
import { MemberBenefitDollarsComponent } from "./member-benefit-dollars/member-benefit-dollars.component";
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";
import { DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [MemberBenefitDollarsComponent],
    imports: [CommonModule, MemberBenefitDollarsRoutingModule, SharedModule, UiModule, DashboardNgxsStoreModule],
})
export class MemberBenefitDollarsModule {}
