import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { LanguageModule } from "@empowered/language";
import { DisplaySubProducerListComponent } from "./display-sub-producer-list/display-sub-producer-list.component";
import { TEAM_ROUTES } from "./team.routes";
import { SubProducerInfoComponent } from "./sub-producer-info/sub-producer-info.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [CommonModule, RouterModule.forChild(TEAM_ROUTES), SharedModule, LanguageModule, UiModule],
    declarations: [DisplaySubProducerListComponent, SubProducerInfoComponent],
    exports: [DisplaySubProducerListComponent],
})
export class TeamModule {}
