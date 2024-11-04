import { ConfigName } from "../../enums";
import { Entity } from "../store";

export interface ConfigurationIdentifiers {
    configurationName: ConfigName;
}

export type ConfigurationsEntity<Value> = Entity<ConfigurationIdentifiers, Value>;
