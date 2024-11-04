import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { MemberBenefitDollarsComponent } from "./member-benefit-dollars/member-benefit-dollars.component";

const routes: Routes = [{ path: "", component: MemberBenefitDollarsComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MemberBenefitDollarsRoutingModule {}
