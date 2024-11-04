import { NgModule } from "@angular/core";
import {
    SharedNGXSStoreModule,
    DualPlanYearNGXSStoreModule,
    EnrollmentMethodNGXSStoreModule,
    GroupNGXSStoreModule,
    RequestNGXSStoreModule,
} from "@empowered/ngxs-store";

@NgModule({
    declarations: [],
    imports: [
        SharedNGXSStoreModule,
        RequestNGXSStoreModule,
        DualPlanYearNGXSStoreModule,
        EnrollmentMethodNGXSStoreModule,
        GroupNGXSStoreModule,
    ],
})
export class SharedStoreModule {}
