import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { PolicyChangeRequestState } from "./request.state";

@NgModule({
    imports: [NgxsModule.forFeature([PolicyChangeRequestState])],
})
export class PolicyChangeRequestStoreModule {}
