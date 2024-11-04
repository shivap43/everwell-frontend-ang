import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { RequestState } from "./request-state";

@NgModule({
    imports: [NgxsModule.forFeature([RequestState])],
})
export class RequestNGXSStoreModule {}
