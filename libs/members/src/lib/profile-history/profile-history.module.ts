import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ProfileHistoryRoutingModule } from "./profile-history-routing.module";
import { ProfileHistoryComponent } from "./profile-history/profile-history.component";
import { SharedModule } from "@empowered/shared";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [ProfileHistoryComponent],
    imports: [CommonModule, ProfileHistoryRoutingModule, SharedModule, UiModule],
})
export class ProfileHistoryModule {}
