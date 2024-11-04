import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { NgxMaskModule } from "ngx-mask";

import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatBadgeModule } from "@angular/material/badge";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DEFAULT_OPTIONS } from "@angular/material/dialog";
import { MatExpansionModule, MAT_EXPANSION_PANEL_DEFAULT_OPTIONS } from "@angular/material/expansion";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorIntl, MatPaginatorModule } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSortModule } from "@angular/material/sort";
import { MatStepperModule } from "@angular/material/stepper";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTreeModule } from "@angular/material/tree";
import { TextFieldModule } from "@angular/cdk/text-field";
import { CustomMatPaginatorIntl } from "./custom-mat-paginator-int";
import { PortalModule } from "@angular/cdk/portal";
import { DATE_FNS_FORMATS, DateFnsDateAdapter } from "@empowered/date";
import { enUS } from "date-fns/locale";

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        MatToolbarModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatProgressBarModule,
        MatMenuModule,
        MatTableModule,
        MatSelectModule,
        MatDatepickerModule,
        MatRadioModule,
        MatNativeDateModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatStepperModule,
        MatCheckboxModule,
        MatDialogModule,
        MatPaginatorModule,
        MatSortModule,
        MatTooltipModule,
        MatChipsModule,
        MatTabsModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatAutocompleteModule,
        MatExpansionModule,
        PortalModule,
        TextFieldModule,
        MatBadgeModule,
        MatTreeModule,
        NgxMaskModule.forRoot(),
    ],
    exports: [
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        MatToolbarModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatMenuModule,
        MatButtonToggleModule,
        MatTableModule,
        MatSelectModule,
        MatDatepickerModule,
        MatRadioModule,
        MatNativeDateModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatStepperModule,
        MatCheckboxModule,
        MatTooltipModule,
        MatChipsModule,
        MatTabsModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatAutocompleteModule,
        MatExpansionModule,
        PortalModule,
        TextFieldModule,
        MatBadgeModule,
        MatTreeModule,
    ],
    providers: [
        { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl },
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: "outline" } },
        { provide: MAT_EXPANSION_PANEL_DEFAULT_OPTIONS, useValue: { collapsedHeight: "52px", expandedHeight: "52px" } },
        { provide: MatDialogRef, useValue: {} },
        {
            provide: MAT_DIALOG_DEFAULT_OPTIONS,
            useValue: {
                hasBackdrop: true,
                closeOnNavigation: true,
                restoreFocus: true,
                role: "dialog",
            },
        },
        { provide: MAT_DATE_FORMATS, useValue: DATE_FNS_FORMATS },
        { provide: DateAdapter, useClass: DateFnsDateAdapter },
        { provide: MAT_DATE_LOCALE, useValue: enUS },
    ],
})
export class MaterialModule {}
