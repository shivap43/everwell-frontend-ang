import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
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
import { CompletedFormsRoutingModule } from "./completed-forms-routing.module";
import { CompletedFormsComponent } from "./completed-forms.component";
import { MaterialModule, SummaryPipe } from "@empowered/ui";

@NgModule({
    declarations: [CompletedFormsComponent],
    imports: [
        CommonModule,
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
        CompletedFormsRoutingModule,
    ],
    providers: [SummaryPipe, DatePipe],
})
export class CompletedFormsModule {}
