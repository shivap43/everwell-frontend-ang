import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { ContactInfoPopupComponent } from "./contact-info-popup/contact-info-popup.component";
import { DependentAddComponent } from "./dependent-add.component";
import { DEPENDENT_ADD_ROUTES } from "./dependent-add.routes";
import { DependentContactInfoComponent } from "./dependent-contact-info/dependent-contact-info.component";
import { DependentPersonalInfoComponent } from "./dependent-personal-info/dependent-personal-info.component";
import { LanguageModule } from "@empowered/language";
import { DependentExitDialogComponent } from "./dependent-exit-dialog/dependent-exit-dialog.component";
import { NgxMaskModule } from "ngx-mask";
import { PhoneFormatConverterPipe, UiModule } from "@empowered/ui";
import { DashboardNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    declarations: [
        DependentAddComponent,
        DependentPersonalInfoComponent,
        DependentContactInfoComponent,
        ContactInfoPopupComponent,
        DependentExitDialogComponent,
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(DEPENDENT_ADD_ROUTES),
        SharedModule,
        LanguageModule,
        NgxMaskModule.forRoot(),
        UiModule,
        DashboardNgxsStoreModule,
    ],
    providers: [PhoneFormatConverterPipe],
})
export class DependentAddModule {}
