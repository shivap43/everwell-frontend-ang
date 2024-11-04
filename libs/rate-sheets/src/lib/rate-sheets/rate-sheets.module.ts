import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { SettingsDropdownComponentStore, UiModule } from "@empowered/ui";
import { RATE_SHEETS_ROUTES } from "./rate-sheets.routes";
import { RateSheetsComponent } from "./rate-sheets/rate-sheets.component";
import { RateSheetsSettingModule } from "./rate-sheets/rate-sheets-setting/rate-sheets-setting.module";
import { ProductsComponent } from "./rate-sheets/products/products.component";
import { UniversalQuoteNGXSStoreModule } from "@empowered/ngxs-store";
import { PlanSeriesComponent } from "./rate-sheets/plan-series/plan-series.component";
import { PlanSeriesSettingsModule } from "./rate-sheets/plan-series/plan-series-settings/plan-series-settings.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { PlanSelectionModule } from "./rate-sheets/plan-series/plan-selection/plan-selection.module";
import { CreateRateSheetComponent } from "./rate-sheets/create-rate-sheet/create-rate-sheet.component";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatTableModule } from "@angular/material/table";
import { EditPlanOrderComponent } from "./rate-sheets/create-rate-sheet/edit-plan-order/edit-plan-order.component";
import { CdkTableModule } from "@angular/cdk/table";
import { DragDropModule } from "@angular/cdk/drag-drop";

@NgModule({
    declarations: [RateSheetsComponent, ProductsComponent, PlanSeriesComponent, CreateRateSheetComponent, EditPlanOrderComponent],
    imports: [
        RouterModule.forChild(RATE_SHEETS_ROUTES),
        LanguageModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        UiModule,
        RateSheetsSettingModule,
        PlanSeriesSettingsModule,
        UniversalQuoteNGXSStoreModule,
        PlanSelectionModule,
        MatBottomSheetModule,
        MatTableModule,
        CdkTableModule,
        DragDropModule,
    ],
    providers: [SettingsDropdownComponentStore],
})
export class RateSheetsModule {}
