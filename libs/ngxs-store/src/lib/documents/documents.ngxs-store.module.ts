import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { DocumentsState } from "./documents.state"; // <-- migrated state

@NgModule({
    imports: [NgxsModule.forFeature([DocumentsState])], // <-- import feature
})
export class DocumentsNGXSStoreModule {}
