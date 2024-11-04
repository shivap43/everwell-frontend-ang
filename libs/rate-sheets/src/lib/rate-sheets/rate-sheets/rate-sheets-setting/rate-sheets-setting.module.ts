import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageModule } from "@empowered/language";
import { MaterialModule, UiModule } from "@empowered/ui";
import { RateSheetsSettingComponent } from "./rate-sheets-setting.component";
import { StateComponent } from "./state/state.component";
import { ChannelComponent } from "./channel/channel.component";
import { PaymentFrequencyComponent } from "./payment-frequency/payment-frequency.component";
import { JobClassComponent } from "./job-class/job-class.component";
import { MoreSettingsComponent } from "./more-settings/more-settings.component";

@NgModule({
    declarations: [
        RateSheetsSettingComponent,
        StateComponent,
        ChannelComponent,
        PaymentFrequencyComponent,
        JobClassComponent,
        MoreSettingsComponent,
    ],
    imports: [CommonModule, LanguageModule, ReactiveFormsModule, UiModule, MaterialModule],
    exports: [RateSheetsSettingComponent],
})
export class RateSheetsSettingModule {}
