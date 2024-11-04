import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { DependentListState } from "./dependent-list.state";
import { MemberInfoState } from "./member-add.state";
import { MemberBeneficiaryListState } from "./member-beneficiary.state";
import { MemberListState } from "./member-list.state";
import { MemberState } from "./member.state";

@NgModule({
    imports: [NgxsModule.forFeature([MemberState, DependentListState, MemberInfoState, MemberBeneficiaryListState, MemberListState])],
})
export class MembersNgxsStoreModule {}
