import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { AudienceGroupBuilderState } from "./audience-group-state";

@NgModule({
    imports: [NgxsModule.forFeature([AudienceGroupBuilderState])],
})
export class AudienceGroupNGXSStoreModule {}
