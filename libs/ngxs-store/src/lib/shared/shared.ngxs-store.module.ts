import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { SharedState } from "./shared.state";

@NgModule({
    imports: [NgxsModule.forFeature([SharedState])],
})
export class SharedNGXSStoreModule {}
