import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { AccountInfoState } from "./dashboard.state";

@NgModule({
    imports: [NgxsModule.forFeature([AccountInfoState])],
})
export class DashboardNgxsStoreModule {}
