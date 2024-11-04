import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { CommissionsState } from "./commissions.state";

@NgModule({
    imports: [NgxsModule.forFeature([CommissionsState])],
})
export class CommissionsNgxsStoreModule {}
