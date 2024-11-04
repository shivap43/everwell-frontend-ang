import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { TPIState } from "./tpi.state";

@NgModule({
    imports: [NgxsModule.forFeature([TPIState])],
})
export class TPINGXSStoreModule {}
