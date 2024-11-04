import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ActivitiesHistoryRoutingModule } from "./activities-history-routing.module";
import { ActivityHistoryComponent } from "./activity-history/activity-history.component";
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [ActivityHistoryComponent],
    imports: [CommonModule, ActivitiesHistoryRoutingModule, SharedModule, UiModule],
})
export class ActivitiesHistoryModule {}
