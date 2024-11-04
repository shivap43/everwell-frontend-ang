import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CarrierFormManageComponent } from "./carrier-form-manage.component";
import { ViewFormManageComponent } from "./view-form-manage/view-form-manage.component";
import { SharedModule } from "@empowered/shared";
import { BenefitOfferingNgxsStoreModule } from "@empowered/ngxs-store";
import { BenefitSharedModule } from "../../benefit-shared.module";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [CarrierFormManageComponent, ViewFormManageComponent],
    imports: [CommonModule, SharedModule, BenefitOfferingNgxsStoreModule, BenefitSharedModule, UiModule],
    exports: [CarrierFormManageComponent, ViewFormManageComponent],
})
export class CarrierFormManageModule {}
