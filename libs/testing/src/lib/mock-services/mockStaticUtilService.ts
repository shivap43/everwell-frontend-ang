import { Configurations } from "@empowered/constants";
import { of } from "rxjs";

export const mockStaticUtilService = {
    cacheConfigValue: (configName: string) => of("some-config-value"),
    cacheConfigEnabled: (configName: string) => of(false),
    hasPermission: (permission: string) => of(true),
    hasAllPermission: (permission: string) => of(true),
    cacheConfigs: (configNames: string[]) => of([{ name: "config-name", value: "config-value", dataType: "string" }]),
    fetchConfigs: (configNames: string[], mpGroup?: number) => of([{ name: "config-name", value: "config-value", dataType: "string" }]),
    isConfigEnabled: (config: Partial<Configurations>) => (config.value?.toLowerCase() === "true" ? true : false),
};
