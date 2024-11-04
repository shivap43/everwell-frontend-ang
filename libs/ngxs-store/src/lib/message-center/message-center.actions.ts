/* eslint-disable max-classes-per-file */

import { BoxType } from "@empowered/api";
import { GroupAction } from "../group";

export class GetBoxTypeThreads implements GroupAction {
    static readonly type = "[MessageCenter] getThreads";

    constructor(public groupId: number, public boxType: BoxType, public forceRefresh: boolean = false, public search?: string) {}
}

export class GetThreadMessages implements GroupAction {
    static readonly type = "[MessageCenter] getThreadMessages";

    constructor(public groupId: number, public threadId: number, public forceRefresh: boolean = false) {}
}

export class GetThreadAdminComments implements GroupAction {
    static readonly type = "[MessageCenter] getAdminComments";

    constructor(public groupId: number, public threadId: number, public forceRefresh: boolean = false) {}
}

export class GetMessageCategories implements GroupAction {
    static readonly type = "[MessageCenter] getMessageCategories";

    constructor(public groupId: number, public forceRefresh: boolean = false) {}
}

export class GetCategoryAdminAssignments implements GroupAction {
    static readonly type = "[MessageCenter] getCategoryAdminAssignments";

    constructor(public groupId: number, public categoryId: number, public forceRefresh: boolean = false) {}
}

export class GetAccountAdmins implements GroupAction {
    static readonly type = "[MessageCenter] getAccountAdmins";

    constructor(public groupId: number) {}
}

export class GetAccountMembers implements GroupAction {
    static readonly type: string = "[MessageCenter] getAccountMembers";

    constructor(public groupId: number, public forceRefresh: boolean = false) {}
}

export class GetAccountProducers implements GroupAction {
    static readonly type: string = "[MessageCenter] getAccountProducers";

    constructor(public groupId: number, public forceRefresh: boolean = false) {}
}

export class GetSupervisoryAdmin implements GroupAction {
    static readonly type: string = "[MessageCenter] getSupervisoryAdmin";

    constructor(public groupId: number, public forceRefresh: boolean = false) {}
}
