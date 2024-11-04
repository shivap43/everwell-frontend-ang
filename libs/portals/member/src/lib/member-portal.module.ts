import { NgModule } from "@angular/core";
import { SharedModule } from "@empowered/shared";
import { MemberPortalRoutingModule } from "./member-portal-routing.module";

import { MemberPortalComponent } from "./member-portal.component";
import { LanguageModule } from "@empowered/language";
import { MemberService } from "@empowered/api";
import { MembersService } from "@empowered/ngxs-store";

@NgModule({
    imports: [MemberPortalRoutingModule, SharedModule, LanguageModule],
    declarations: [MemberPortalComponent],
    providers: [MembersService, MemberService],
})
export class MemberPortalModule {}
