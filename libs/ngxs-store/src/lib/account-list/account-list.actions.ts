/* eslint-disable max-classes-per-file */

import { AccountList } from "@empowered/api";
import { Accounts } from "@empowered/constants";

export class AddAccountList {
    static readonly type = "[AccountListItem] add";

    constructor(private payload: AccountList[]) {}
}

export class AddGroup {
    static readonly type = "[AddGroup] addGroup";

    constructor(private payload: AccountList | Accounts) {}
}
