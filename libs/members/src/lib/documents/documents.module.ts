import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DocumentsRoutingModule } from "./documents-routing.module";
import { AddUpdateDocumentComponent } from "./add-update-document/add-update-document.component";
import { DocumentsComponent } from "./documents.component";
import { SharedModule, UiComponentsModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { NgxDropzoneModule } from "ngx-dropzone";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTabsModule } from "@angular/material/tabs";
import { UiModule, MaterialModule, SummaryPipe } from "@empowered/ui";

@NgModule({
    declarations: [AddUpdateDocumentComponent, DocumentsComponent],
    imports: [
        CommonModule,
        DocumentsRoutingModule,
        SharedModule,
        UiComponentsModule,
        MatFormFieldModule,
        MatInputModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        LanguageModule,
        MaterialModule,
        NgxDropzoneModule,
        UiModule,
    ],
    providers: [SummaryPipe],
})
export class DocumentsModule {}
