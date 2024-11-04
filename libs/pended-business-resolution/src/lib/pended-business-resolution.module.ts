import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { NgModule } from "@angular/core";
import { CommonModule, CurrencyPipe, TitleCasePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { PBROverviewComponent } from "./pbr-overview/pbr-overview.component";
import { PBR_ROUTES } from "./pended-business-resolution.routes";
import { PendedAppsComponent } from "./pended-apps/pended-apps.component";
import { AppsDetailsComponent } from "./pended-app-details/apps-details.component";
import { PendedAppsResolveAppComponent } from "./pended-apps/pended-apps-resolve-app/pended-apps-resolve-app.component";
import { ResolvedAppsComponent } from "./resolved-apps/resolved-apps.component";
import { NewlyTransmittedAppsComponent } from "./newly-transmitted-apps/newly-transmitted-apps.component";
import { PendedBusinessComponent } from "./pended-business.component";
import { ResolveApplicationModalComponent } from "./resolve-application-modal/resolve-application-modal.component";
import { PendedApplicationsModalComponent } from "./pended-applications-modal/pended-applications-modal.component";
import { UploadApplicationModalComponent } from "./upload-application-modal/upload-application-modal.component";
import { AllPendedAppsComponent } from "./pended-apps/all-pended-apps/all-pended-apps.component";
import { AccountAppsComponent } from "./pended-apps/account-apps/account-apps.component";
import { ProducerAppsComponent } from "./pended-apps/producer-apps/producer-apps.component";
import { GroupDetailsComponent } from "./pended-apps/group-details/group-details.component";
import { AccountTabComponent } from "./pended-apps/account-tab/account-tab.component";
import { ProducerTabComponent } from "./pended-apps/producer-tab/producer-tab.component";
import { PendedBusinessHeaderComponent } from "./pended-business-header/pended-business-header.component";
import { PbrSubHeaderComponent } from "./pbr-sub-header/pended-business-sub-header.component";
import { PbrCommonService } from "./pbr-common.service";
import { UiModule } from "@empowered/ui";
import { PendedBusinessResolutionStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [RouterModule.forChild(PBR_ROUTES), CommonModule, LanguageModule, SharedModule, PendedBusinessResolutionStoreModule, UiModule],
    declarations: [
        PBROverviewComponent,
        PendedAppsComponent,
        PendedAppsResolveAppComponent,
        ResolvedAppsComponent,
        NewlyTransmittedAppsComponent,
        AppsDetailsComponent,
        PendedBusinessComponent,
        ResolveApplicationModalComponent,
        PendedApplicationsModalComponent,
        UploadApplicationModalComponent,
        AllPendedAppsComponent,
        AccountAppsComponent,
        ProducerAppsComponent,
        GroupDetailsComponent,
        PbrSubHeaderComponent,
        AccountTabComponent,
        ProducerTabComponent,
        PendedBusinessHeaderComponent,
    ],
    providers: [CurrencyPipe, TitleCasePipe, PbrCommonService],
})
export class PendedBusinessResolutionModule {}
