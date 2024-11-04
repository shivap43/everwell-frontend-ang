export interface BenefitDocument {
    id: number;
    fileName: string;
    type: string;
    uploadDate: string;
    uploadAdminId: number;
    status: string;
}
export interface CensusEstimateCount {
    totalEligible: number;
}
