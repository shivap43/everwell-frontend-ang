/* eslint-disable max-classes-per-file */

import { Name, MemberProfile, Relations, MemberDependent, MemberContact } from "@empowered/constants";

export class SetGroupId {
    static readonly type = "[RegData] SetGroupId";

    constructor(public groupId: number) {}
}

export class SetEmail {
    static readonly type = "[RegData] SetEmail";

    constructor(public email: string) {}
}

export class SetPhone {
    static readonly type = "[RegData] SetPhone";

    constructor(public phone: string) {}
}

export class SetRegistrationMemberId {
    static readonly type = "[RegData] SetRegistrationMemberId";

    constructor(public memberId: number) {}
}

export class SetUserName {
    static readonly type = "[RegData] SetUserName";
    constructor(public userName: string) {}
}

export class SetAdminId {
    static readonly type = "[RegData] SetAdminId";

    constructor(public adminId: number) {}
}

export class SetProducerId {
    static readonly type = "[RegData] SetProducerId";

    constructor(public producerId: number) {}
}

export class SetPersonalForm {
    static readonly type = "[RegData] SetPersonalForm";

    constructor(public personalForm: MemberProfile) {}
}

export class SetName {
    static readonly type = "[RegData] SetName";

    constructor(public name: Name) {}
}

export class SetContactForm {
    static readonly type = "[RegData] SetContactForm";

    constructor(public contactForm: MemberContact) {}
}

export class GetCsrf {
    static readonly type = "[GetCsrf] GetCsrf";
}

export class SetRelations {
    static readonly type = "[RegData] SetRelations";

    constructor(public relations: Relations[]) {}
}

export class SetDependents {
    static readonly type = "[RegData] SetDependnets";

    constructor(public dependents: MemberDependent[]) {}
}

export class SetMultipleAccountMode {
    static readonly type = "[RegData] SetMultipleAccountMode";

    constructor(public multipleAccountMode: boolean) {}
}
