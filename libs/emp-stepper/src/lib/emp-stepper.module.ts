// TODO: CD - Have to remove UiComponentsModule reference after all components are moved
import { UiComponentsModule } from "@empowered/shared";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { EmpStepperComponent } from "./emp-stepper/emp-stepper.component";
import { TabBarComponent } from "./tab-bar/tab-bar.component";
import { TabComponent } from "./tab/tab.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [CommonModule, MatIconModule, UiComponentsModule, UiModule],
    declarations: [EmpStepperComponent, TabComponent, TabBarComponent],
    exports: [EmpStepperComponent, TabBarComponent],
})
export class EmpStepperModule {}
