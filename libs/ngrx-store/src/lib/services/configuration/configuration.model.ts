import { Configuration, ConfigurationDataType } from "@empowered/constants";

/**
 * Function Overloads for what the expected return type is based on DataType
 */
export interface GetProcessedConfiguration {
    (configuration: Configuration<ConfigurationDataType.STRING>): string;
    (configuration: Configuration<ConfigurationDataType.INTEGER>): number;
    (configuration: Configuration<ConfigurationDataType.BOOLEAN>): boolean;
    (configuration: Configuration<ConfigurationDataType.LIST_STRING>): string[];
    (configuration: Configuration<ConfigurationDataType.LIST_INTEGER>): number[];
    (configuration: Configuration<ConfigurationDataType.LIST_BOOLEAN>): boolean[];
    (configuration: Configuration): unknown;
}

// When we actually handle parsing BOOLEAN config values, the value is lowercased,
// so even if the config value is "TRUE" or "True", it will be handled as true
export enum ConfigurationBooleanValue {
    TRUE = "true",
    FALSE = "false",
}
