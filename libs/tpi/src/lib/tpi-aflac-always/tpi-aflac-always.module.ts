import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TpiAflacAlwaysRoutingModule } from "./tpi-aflac-always-routing.module";
import { AflacAlwaysModule } from "@empowered/aflac-always";
import { TpiAflacAlwaysContainerComponent } from "./tpi-aflac-always-container/tpi-aflac-always-container.component";
import { UiModule } from "@empowered/ui";
import { TpiModule } from "../tpi.module";
import { LanguageModule } from "@empowered/language";

@NgModule({
    declarations: [TpiAflacAlwaysContainerComponent],
    imports: [CommonModule, UiModule, LanguageModule, TpiAflacAlwaysRoutingModule, AflacAlwaysModule, TpiModule],
})
export class TpiAflacAlwaysModule {}
