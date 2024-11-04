import { NgModule } from "@angular/core";
import { ReportsComponent } from "./reports.component";
import { ReportsListComponent } from "./reports-list/reports-list.component";
import { CreateReportComponent } from "./create-report/create-report.component";
import { CreateReportFormComponent } from "./create-report-form/create-report-form.component";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { REPORTS_ROUTES } from "./reports.routes";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatSelectModule } from "@angular/material/select";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatRadioModule } from "@angular/material/radio";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DocumentsModule } from "@empowered/documents";
import { SharedModule, UiComponentsModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [ReportsComponent, ReportsListComponent, CreateReportComponent, CreateReportFormComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(REPORTS_ROUTES),
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatButtonModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatSelectModule,
        MatChipsModule,
        MatIconModule,
        MatAutocompleteModule,
        MatBottomSheetModule,
        MatRadioModule,
        MatTooltipModule,
        FormsModule,
        ReactiveFormsModule,
        DocumentsModule,
        UiComponentsModule,
        LanguageModule,
        SharedModule,
        UiModule,
    ],
    providers: [CreateReportComponent],
})
export class ReportsModule {}
