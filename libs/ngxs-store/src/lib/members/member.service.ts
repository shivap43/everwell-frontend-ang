import { MemberState } from "./member.state";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { MemberProfile } from "@empowered/constants";
import { Select } from "@ngxs/store";
import { GetMember, UpdateMember } from "./member.actions";
import { Dispatch } from "@ngxs-labs/dispatch-decorator";

@Injectable()
export class MembersService {
    @Select(MemberState) data$: Observable<MemberProfile>;

    constructor() {}

    @Dispatch()
    getMember = (memberId: MemberProfile["id"], fullProfile: boolean, mpGroup: string) => new GetMember(memberId, fullProfile, mpGroup);

    @Dispatch()
    updateMember = (addMemberModel: MemberProfile, mpGroup: string, stateMemberId?: string) =>
        new UpdateMember(addMemberModel, mpGroup, stateMemberId);
}
