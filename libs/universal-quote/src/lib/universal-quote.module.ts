import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { RouterModule } from "@angular/router";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { UNIVERSAL_QUOTE_ROUTES } from "./universal-quote.routes";
import { UniversalQuoteMainComponent } from "./universal-quote-main/universal-quote-main.component";
import { UniversalQuoteNGXSStoreModule } from "@empowered/ngxs-store";
import { QuickQuoteProductsComponent } from "./universal-quote-main/quick-quote-products/quick-quote-products.component";
import { QuickQuotePlansComponent } from "./universal-quote-main/quick-quote-plans/quick-quote-plans.component";
import { QuoteLevelSettingComponent } from "./universal-quote-main/quote-level-setting/quote-level-setting.component";
import { ResetModalComponent } from "./universal-quote-main/reset-modal/reset-modal.component";
import { CdkTableModule } from "@angular/cdk/table";
import { CreateQuoteComponent } from "./universal-quote-main/create-quote/create-quote.component";
import { EditPlanDetailsComponent } from "./universal-quote-main/edit-plan-details/edit-plan-details.component";
import { MoreSettingsComponent } from "./universal-quote-main/more-settings/more-settings.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(UNIVERSAL_QUOTE_ROUTES),
        UniversalQuoteNGXSStoreModule,
        LanguageModule,
        CdkTableModule,
        CommonModule,
        DragDropModule,
        UiModule,
    ],
    declarations: [
        UniversalQuoteMainComponent,
        QuickQuoteProductsComponent,
        QuickQuotePlansComponent,
        QuoteLevelSettingComponent,
        ResetModalComponent,
        CreateQuoteComponent,
        EditPlanDetailsComponent,
        MoreSettingsComponent,
    ],
})
export class UniversalQuoteModule {}
