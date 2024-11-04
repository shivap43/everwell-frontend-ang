/* eslint-disable max-classes-per-file */

import { Relations } from "@empowered/constants";

export class LoadMemberDependents {
    static readonly type = "[DependentList] Load Member Dependents";

    constructor(public memberId: number, public fullProfile: boolean, public MpGroup: number) {}
}

export class SetMemberGroupId {
    static readonly type = "[DependentList] SetMemberGroupId";

    constructor(public groupId: number) {}
}

export class SetDependentsMemberId {
    static readonly type = "[DependentList] SetDependentsMemberId";

    constructor(public memberId: number) {}
}
export class SetActiveDependentId {
    static readonly type = "[DependentList] SetActiveDependentId";

    constructor(public activeDependentId: number) {}
}

export class SetDependentRelations {
    static readonly type = "[DependentList] SetRelations";

    constructor(public relations: Relations[]) {}
}
