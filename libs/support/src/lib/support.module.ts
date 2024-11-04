import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { FrequentlyAskedQuestionsComponent } from "./components/frequently-asked-questions/frequently-asked-questions.component";
import { LanguageModule } from "@empowered/language";
import { DownloadUnpluggedComponent } from "./components/download-unplugged/download-unplugged.component";
import { TrainingResourcesComponent } from "./components/training-resources/training-resources.component";
import { SupportPageSideNavComponent } from "./components/support-page-side-nav/support-page-side-nav.component";
import { SUPPORT_ROUTES } from "./support.routes";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [FrequentlyAskedQuestionsComponent, DownloadUnpluggedComponent, TrainingResourcesComponent, SupportPageSideNavComponent],
    imports: [RouterModule.forChild(SUPPORT_ROUTES), SharedModule, CommonModule, LanguageModule, UiModule],
})
export class SupportModule {}
