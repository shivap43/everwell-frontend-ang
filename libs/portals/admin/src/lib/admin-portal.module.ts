import { NgModule } from "@angular/core";
import { SharedModule } from "@empowered/shared";
import { AdminPortalRoutingModule } from "./admin-portal-routing.module";
import { CommonModule } from "@angular/common";
import { AdminPortalComponent } from "./admin-portal.component";

@NgModule({
    imports: [AdminPortalRoutingModule, SharedModule, CommonModule],
    declarations: [AdminPortalComponent],
})
export class AdminPortalModule {}
