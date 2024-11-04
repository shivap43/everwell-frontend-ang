import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { ResourceListState } from "./resources-list.state";

@NgModule({
    imports: [NgxsModule.forFeature([ResourceListState])],
})
export class ResourceListNGXSStoreModule {}
