export interface PayFrequency {
    readonly id: number;
    frequencyType: string;
    name: string;
    payrollsPerYear: number;
    displayOrder?: number;
}
