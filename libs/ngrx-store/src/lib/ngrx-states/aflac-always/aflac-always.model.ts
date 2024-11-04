import { AflacAlwaysEnrollmentsSelection, Entity } from "@empowered/constants";

export type AflacAlwaysEnrollmentsUserSelection = Partial<AflacAlwaysEnrollmentsSelection>;

export interface AflacAlwaysEnrollmentsIdentifiers {
    mpGroupId: number;
    memberId: number;
}

export type AflacAlwaysEnrollmentsEntity<T> = Entity<AflacAlwaysEnrollmentsIdentifiers, T>;
