export interface PlanDocument {
    id: number;
    name: string;
    description: string;
    type: string;
    location: string;
    planId: number;
    selected?: boolean;
    documentId?: number;
}
