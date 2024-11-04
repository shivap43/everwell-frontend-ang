import { Entity, RiskClass } from "@empowered/constants";

export interface MemberProfileIdentifiers {
    mpGroup: number; // Compound ID
    memberId: number; // Compound ID
}

export type MemberProfileEntity<Value> = Entity<MemberProfileIdentifiers, Value>;

export interface MemberRiskClasses {
    aflacCarrierRiskClasses: RiskClass[];
    memberRiskClasses: RiskClass[];
}
