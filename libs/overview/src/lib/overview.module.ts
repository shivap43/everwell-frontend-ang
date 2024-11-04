import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OverviewComponent } from "./overview.component";
import { OverviewRoutingModule } from "./overview.routing.module";
import { SharedModule } from "@empowered/shared";

@NgModule({
    imports: [CommonModule, OverviewRoutingModule, SharedModule],
    declarations: [OverviewComponent],
})
export class OverviewModule {}
