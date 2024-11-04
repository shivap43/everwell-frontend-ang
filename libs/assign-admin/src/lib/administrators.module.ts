import { EmailTrackingModule } from "@empowered/email-tracking";
import { NgModule } from "@angular/core";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { DisplayAdminListComponent } from "./display-admin-list/display-admin-list.component";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { RouterModule } from "@angular/router";
import { AdministratorsComponent } from "./administrators/administrators.component";
import { UiModule } from "@empowered/ui";
import { AccountListNgxsStoreModule } from "@empowered/ngxs-store";
@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        LanguageModule,
        EmailTrackingModule,
        RouterModule.forChild([
            {
                path: "",
                component: AdministratorsComponent,
            },
        ]),
        UiModule,
        AccountListNgxsStoreModule,
    ],
    declarations: [DisplayAdminListComponent, AdministratorsComponent],
    exports: [],

    providers: [TitleCasePipe],
})
export class AdministratorsModule {}
