import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { CaseBuilderComponent } from "./case-builder/case-builder.component";
import { RouterModule } from "@angular/router";
import { CASE_BUILDER_ROUTES } from "./case-builder.routes";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { MaterialModule, PhoneFormatConverterPipe, UiModule } from "@empowered/ui";
import { MatTableModule } from "@angular/material/table";
import { CaseBuilderAddEditComponent } from "./case-builder-add-edit/case-builder-add-edit.component";
import { ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "@empowered/shared";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { NgxMaskModule } from "ngx-mask";

@NgModule({
    imports: [
        CommonModule,
        UiModule,
        SharedModule,
        ReactiveFormsModule,
        MatTableModule,
        MaterialModule,
        LanguageModule,
        RouterModule.forChild(CASE_BUILDER_ROUTES),
        NgxMaskModule.forRoot(),
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [CaseBuilderComponent, CaseBuilderAddEditComponent],
    exports: [CaseBuilderComponent, RouterModule, CaseBuilderAddEditComponent],
    providers: [ReplaceTagPipe, DatePipe, PhoneFormatConverterPipe],
})
export class CaseBuilderModule {}
