import { Configurations, Accounts } from "@empowered/constants";

export interface SharedStateModel {
    portal?: string;
    routeAfterLogin?: string;
    showAlert?: boolean;
    regex?: RegexDataType;
    hasSubOrdinate?: boolean;
    memberMPGroupAccount?: Accounts;
    actionRequired?: string;
    configs?: RequestedConfig[];
    permissions?: string[];
    qleIdToCloseSEP?: number;
    urlToNavigateAfterLogin?: string;
    queryParams?: QueryParam;
    isEnroller?: boolean;
}

export interface RequestedConfig {
    configName: string;
    config?: Configurations;
}

export interface RegexDataType {
    [key: string]: string;
}

export interface FileServerBasePath {
    basePath: string;
}

export interface QueryParam {
    memberId: string;
    groupId: string;
}
