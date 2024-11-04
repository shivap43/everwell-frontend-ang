import { SharedModule } from "@empowered/shared";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EmailTrackingComponent } from "./email-tracking/email-tracking.component";
import { LanguageModule } from "@empowered/language";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [CommonModule, SharedModule, LanguageModule, UiModule],
    declarations: [EmailTrackingComponent],
    exports: [EmailTrackingComponent],
})
export class EmailTrackingModule {}
