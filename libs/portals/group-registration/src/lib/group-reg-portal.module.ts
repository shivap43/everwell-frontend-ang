import { SharedModule } from "@empowered/shared";
import { GroupRegPortalRoutingModule } from "./group-reg-portal-routing.module";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GroupRegPortalComponent } from "./group-reg-portal.component";
import { UiModule } from "@empowered/ui";

@NgModule({
    declarations: [GroupRegPortalComponent],
    imports: [CommonModule, GroupRegPortalRoutingModule, SharedModule, UiModule],
})
export class GroupRegPortalModule {}
