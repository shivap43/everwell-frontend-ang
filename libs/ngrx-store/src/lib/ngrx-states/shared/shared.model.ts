import { Entity } from "@empowered/constants";

export interface CitiesIdentifiers {
    stateAbbreviation: string;
}

export type CitiesEntity<Value> = Entity<CitiesIdentifiers, Value>;
