export interface EnrollmentDependent {
    dependentId: number;
    name: string;
    validity: {
        effectiveStarting: string;
        expiresAfter: string;
    };
}
