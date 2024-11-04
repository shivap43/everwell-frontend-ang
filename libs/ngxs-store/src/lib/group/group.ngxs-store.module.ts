import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { GroupState } from "./group.state";

@NgModule({
    imports: [NgxsModule.forFeature([GroupState])],
})
export class GroupNGXSStoreModule {}
