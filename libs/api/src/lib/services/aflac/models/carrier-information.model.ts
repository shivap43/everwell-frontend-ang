export interface CarrierInfo {
    commissionSplitEligible: boolean;
    id: string;
    name: string;
}
export interface CarrierContact {
    address: string;
    email: string;
    id: number;
    isPrimary: boolean;
    name: string;
    phoneNumber: string;
}

export interface CarriersList {
    carrier: CarrierInfo;
    department: string;
    employeeId: string;
    industryCode: string;
    sicCode: string;
}
