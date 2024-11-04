import { ConfigName, ConfigurationDataType } from "../../enums";
import { Configurations } from "../configuration.model";

/**
 * The existing Configurations interface doesn't use the existing enums for Configurations,
 * so this interface should be used instead
 */
export interface Configuration<T extends ConfigurationDataType = ConfigurationDataType> extends Configurations {
    name: ConfigName;
    value: string;
    dataType: T;
}
