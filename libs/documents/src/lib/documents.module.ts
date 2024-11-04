import { NgModule } from "@angular/core";
import { DocumentsService } from "./documents.service";
import { DocumentsNGXSStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [DocumentsNGXSStoreModule],
    providers: [DocumentsService],
})
export class DocumentsModule {}
