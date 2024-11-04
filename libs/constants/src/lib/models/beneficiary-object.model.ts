export interface BeneficiaryModel {
    name?: string;
    birthDate?: string;
    dependentId?: number;
    id?: number;
    city?: string;
    ssn?: string;
    phone?: string;
    type?: string;
    relation?: string;
    duplicateName?: boolean;
    isMember?: boolean;
    address1?: string;
    address2?: string;
    state?: string;
    zip?: string;
}

export interface EmployeeData {
    firstName?: string;
    lastName?: string;
    hireDate?: string;
}
