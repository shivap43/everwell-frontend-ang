import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { PathState } from "./path.state";

@NgModule({
    imports: [NgxsModule.forFeature([PathState])],
})
export class PathNgxsStoreModule {}
