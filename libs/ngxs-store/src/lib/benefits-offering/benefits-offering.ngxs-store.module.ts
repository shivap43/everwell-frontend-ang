import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { BenefitsOfferingState } from "./benefits-offering.state";

@NgModule({
    imports: [NgxsModule.forFeature([BenefitsOfferingState])],
})
export class BenefitOfferingNgxsStoreModule {}
