import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { QleState } from "./qle.state";

@NgModule({
    imports: [NgxsModule.forFeature([QleState])],
})
export class QleNGXSStoreModule {}
