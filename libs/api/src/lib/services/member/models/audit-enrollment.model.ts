import { Enrollments } from "@empowered/constants";

export interface AuditEnrollment {
    auditedEnrollment: Enrollments;
    updateAdmin?: UpdateAdmin;
    policyStatus?: string;
}

interface UpdateAdmin {
    producerId?: number;
    name?: string;
}
