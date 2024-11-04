import { ConfigName } from "../../enums";
import { Entity } from "../store";

export interface RawConfigurationIdentifiers {
    configurationNameRegex: ConfigName | string;
}

export type RawConfigurationsEntity<Value> = Entity<RawConfigurationIdentifiers, Value>;
