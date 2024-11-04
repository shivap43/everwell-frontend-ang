import { Entity } from "@empowered/constants";

export interface ProducerInformationsIdentifiers {
    producerId: number;
}

export type ProducerInformationsEntity<Value> = Entity<ProducerInformationsIdentifiers, Value>;

export interface LicensedStateSetsIdentifiers {
    mpGroup: number;
}

export type LicensedStateSetsEntity<Value> = Entity<LicensedStateSetsIdentifiers, Value>;
