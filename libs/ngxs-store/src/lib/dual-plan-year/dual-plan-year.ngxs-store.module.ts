import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { DualPlanYearState } from "./dual-plan-year.state";

@NgModule({
    imports: [NgxsModule.forFeature([DualPlanYearState])],
})
export class DualPlanYearNGXSStoreModule {}
