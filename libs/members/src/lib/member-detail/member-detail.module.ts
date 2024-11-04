import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@empowered/shared";
import { MemberDetailComponent } from "./member-detail.component";
import { MEMBER_DETAIL_ROUTES } from "./member-detail.routes";

@NgModule({
    declarations: [MemberDetailComponent],
    imports: [RouterModule.forChild(MEMBER_DETAIL_ROUTES), SharedModule],
})
export class MemberDetailModule {}
