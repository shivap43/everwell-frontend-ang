import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxsModule } from "@ngxs/store";
import { BenefitOfferingNgxsStoreModule } from "@empowered/ngxs-store";
import { RouterModule } from "@angular/router";
import { BENEFIT_ROUTES } from "./benefits.routes";

@NgModule({
    imports: [CommonModule, BenefitOfferingNgxsStoreModule, RouterModule.forChild(BENEFIT_ROUTES)],
    declarations: [],
    bootstrap: [],
})
export class BenefitsModule {}
