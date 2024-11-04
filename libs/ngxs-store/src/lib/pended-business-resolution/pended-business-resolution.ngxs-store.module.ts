import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { PendedBusinessState } from "./pended-business.state";

@NgModule({
    imports: [NgxsModule.forFeature([PendedBusinessState])],
})
export class PendedBusinessResolutionStoreModule {}
