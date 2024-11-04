import { Injectable } from "@angular/core";
import { Configuration, ConfigurationDataType } from "@empowered/constants";
import { ConfigurationBooleanValue, GetProcessedConfiguration } from "./configuration.model";

/**
 * Convert Configuration value to string
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {string} processed value
 */
export const getStringValue = (value: string): string => String(value);

/**
 * Convert Configuration value to number
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {number} processed value
 */
export const getIntegerValue = (value: string): number => Number(value);

/**
 * Convert Configuration value to boolean.
 * All non-case sensitive versions of "true", i.e. "TRUE", "True", "true", etc is `true`.
 * Anything else is treated as `false`
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {boolean} processed value
 */
export const getBooleanValue = (value: string): boolean => value.toLowerCase() === ConfigurationBooleanValue.TRUE;
/**
 * Convert Configuration value to an array of "raw" values
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {string} array of "raw" values separated by commas (,)
 */
export const getList = (value: string): string[] => value.split(",").map((dirtyValue) => dirtyValue.trim());

/**
 * Convert Configuration value to string[]
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {string[]} processed value
 */
export const getListStringValue = (value: string): string[] => getList(value).map(getStringValue);

/**
 * Convert Configuration value to number[]
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {number[]} processed value
 */
export const getListIntegerValue = (value: string): number[] => getList(value).map(getIntegerValue);

/**
 * Convert Configuration value to boolean[]
 *
 * @param value {string} raw Configuration value (before being processed)
 *
 * @returns {boolean[]} processed value
 */
export const getListBooleanValue = (value: string): boolean[] => getList(value).map(getBooleanValue);

/**
 * Process the Configuartion value (which is always a string)
 * to whatever its actual value is supposed to be using Configuration DataType
 *
 * @param configuration {Configuration}
 *
 * @returns {ReturnType<GetProcessedConfiguration>} Value is unknown without knowing beforehand what the DataType is
 */
export const getProcessedConfigurationValue: GetProcessedConfiguration = (configuration: Configuration): any => {
    switch (configuration.dataType) {
        case ConfigurationDataType.STRING:
            return getStringValue(configuration.value);
        case ConfigurationDataType.INTEGER:
            return getIntegerValue(configuration.value);
        case ConfigurationDataType.BOOLEAN:
            return getBooleanValue(configuration.value);
        case ConfigurationDataType.LIST_STRING:
            return getListStringValue(configuration.value);
        case ConfigurationDataType.LIST_INTEGER:
            return getListIntegerValue(configuration.value);
        case ConfigurationDataType.LIST_BOOLEAN:
            return getListBooleanValue(configuration.value);
        default:
            throw new Error("Unexpected ConfigurationDataType");
    }
};

@Injectable({
    providedIn: "root",
})
export class ConfigurationService {
    constructor() {}

    /**
     * Process the Configuartion value (which is always a string)
     * to whatever its actual value is supposed to be using Configuration DataType
     *
     * @param configuration {Configuration}
     *
     * @returns {ReturnType<GetProcessedConfiguration>} Value is unknown without knowing beforehand what the DataType is
     */
    getProcessedConfigurationValue(configuration: Configuration): ReturnType<GetProcessedConfiguration> {
        return getProcessedConfigurationValue(configuration);
    }
}
