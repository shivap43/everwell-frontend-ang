import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PROFILE_ROUTES } from "./profile.routes";
import { RouterModule } from "@angular/router";
import { NgxsModule } from "@ngxs/store";
import { SharedModule, UiComponentsModule } from "@empowered/shared";
import { AccountInfoComponent } from "./account-info/account-info.component";
import { AccountContactsComponent } from "./account-contacts/account-contacts.component";
import { CarriersComponent } from "./carriers/carriers.component";
import { EditAccountInfoComponent } from "./account-info/edit-account-info/edit-account-info.component";
import { LanguageModule } from "@empowered/language";
import { RulesComponent } from "./rules/rules.component";
import { AccountBrandingModule } from "@empowered/branding";
import { ImportAccountComponent } from "./import-account/import-account.component";
import { AgRefreshPopupComponent } from "./ag-refresh-popup/ag-refresh-popup.component";
import { HqAdminReviewBoComponent } from "./hq-admin-review-bo/hq-admin-review-bo.component";
import { RequestChangesDialogComponent } from "./hq-admin-review-bo/request-changes-dialog/request-changes-dialog.component";
import { SaveAndClosePopUpComponent } from "./hq-admin-review-bo/save-and-close-pop-up/save-and-close-pop-up.component";
import { AgRemovePopupComponent } from "./ag-remove-popup/ag-remove-popup.component";
// eslint-disable-next-line max-len
import { AgProductPriceDisplayListComponent } from "./hq-admin-review-bo/ag-product-price-display-list/ag-product-price-display-list.component";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { UiModule, MaterialModule, PhoneFormatConverterPipe } from "@empowered/ui";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        NgxsModule,
        RouterModule.forChild(PROFILE_ROUTES),
        SharedModule,
        UiComponentsModule,
        LanguageModule,
        MaterialModule,
        AccountBrandingModule,
        MatBottomSheetModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        AccountInfoComponent,
        AccountContactsComponent,
        CarriersComponent,
        EditAccountInfoComponent,
        RulesComponent,
        ImportAccountComponent,
        AgRefreshPopupComponent,
        HqAdminReviewBoComponent,
        RequestChangesDialogComponent,
        SaveAndClosePopUpComponent,
        AgRemovePopupComponent,
        AgProductPriceDisplayListComponent,
    ],
    providers: [PhoneFormatConverterPipe],
})
export class ProfileModule {}
