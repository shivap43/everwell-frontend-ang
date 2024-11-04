/* eslint-disable max-classes-per-file */

import { SearchProducer } from "@empowered/api";
import { Configurations } from "@empowered/constants";
import { QueryParam } from "./shared.model";

export class SetPortal {
    static readonly type = "[Shared] SetPortal";

    constructor(public portal: string) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetRouteAfterLogin {
    static readonly type = "[Shared] SetRouteAfterLogin";

    constructor(public routeAfterLogin: string) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetQueryParams {
    static readonly type = "[Shared] SetQueryParams";
    constructor(public queryParams: QueryParam) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetIncompleteRegistrationAlert {
    static readonly type = "[Shared] SetIncompleteRegistrationAlert";
    constructor(public alertValue: boolean) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetRegex {
    static readonly type = "[Shared] SetRegex";
}

// eslint-disable-next-line max-classes-per-file
export class SetIsSubOrdinates {
    static readonly type = "[User] Set subordinate";

    constructor(public subordinate: boolean) {}
}
// eslint-disable-next-line max-classes-per-file
export class SetConfig {
    static readonly type = "[Shared] setConfig";

    constructor(public config: Configurations) {}
}

// eslint-disable-next-line max-classes-per-file
export class FetchConfigs {
    static readonly type: string = "[Shared] fetchConfigs";

    constructor(public configName: string) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetPermissions {
    static readonly type: string = "[Shared] setPermissions";

    constructor(public forceOverride?: boolean) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetIdToCloseSEP {
    static readonly type = "[Shared] SetIdToCloseSEP";
    constructor(public qleIdToCloseSEP: number) {}
}

// eslint-disable-next-line max-classes-per-file
export class SetURLNavigationAfterLogin {
    static readonly type = "[Shared] SetURLNavigationAfterLogin";
    constructor(public urlToNavigateAfterLogin: string) {}
}
// eslint-disable-next-line max-classes-per-file
export class ResetRequestStatus {
    static readonly type = "[Shared] ResetRequestStatus";
}

// eslint-disable-next-line max-classes-per-file
export class SetFileServerBasePath {
    static readonly type = "SetFileServerBasePath";
    constructor(public basePath: string) {}
}
// eslint-disable-next-line max-classes-per-file
export class SetSearchedProducer {
    static readonly type = "SetSearchedProducer";
    constructor(public producer: SearchProducer) {}
}

export class SetPrivacyForEnroller {
    static readonly type = "setPrivacyForEnroller";
    constructor(public isEnroller: boolean) {}
}
