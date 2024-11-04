export interface Carrier {
    id: number;
    name: string;
    legalName?: string;
    nameOverride: string;
    commissionSplitEligible: boolean;
}
