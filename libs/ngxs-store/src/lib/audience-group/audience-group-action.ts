/* eslint-disable max-classes-per-file */

export class GetClassTypes {
    static readonly type = "[AudienceGroup] getClassTypes";

    constructor(public forceRefresh?: boolean) {}
}

export class GetEmployeeIds {
    static readonly type = "[AudienceGroup] getEmployeeIds";

    constructor(public forceRefresh?: boolean) {}
}

export class GetClassName {
    static readonly type = "[AudienceGroup] getCLassName";

    constructor(public classTypeId: number, public forceRefresh?: boolean) {}
}

export class GetRegionTypes {
    static readonly type = "[AudienceGroup] getRegionTypes";

    constructor(public forceRefresh?: boolean) {}
}

export class GetRegion {
    static readonly type = "[AudienceGroup] getRegion";

    constructor(public regionTypeId: number, public forceRefresh?: boolean) {}
}

export class GetProductOfferings {
    static readonly type = "[AudienceGroup] getProductOfferings";

    constructor(public forceRefresh?: boolean) {}
}

export class ResetAudienceGroup {
    static readonly type = "[AudienceGroup] resetAudienceGroup";
}
