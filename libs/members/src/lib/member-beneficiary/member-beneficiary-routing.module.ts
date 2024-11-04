import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { BeneficiaryListComponent } from "./beneficiary-list/beneficiary-list.component";

const routes: Routes = [{ path: "", component: BeneficiaryListComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class MemberBeneficiaryRoutingModule {}
