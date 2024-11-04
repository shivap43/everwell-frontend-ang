import { TestBed } from "@angular/core/testing";
import { EnrollmentStatusType, PendingEnrollmentReason, ReinstatementType } from "@empowered/api";
import { Characteristics, Plan, Enrollments } from "@empowered/constants";
import { EnrollmentHelperService } from "./enrollment-helper.service";

describe("EnrollmentHelperService", () => {
    let service: EnrollmentHelperService;
    const enrollmentData = {
        plan: {
            characteristics: [Characteristics.DECLINE],
        },
        validity: {
            expiresAfter: "1990-09-09",
            effectiveStarting: "1989-01-01",
        },
        status: EnrollmentStatusType.APPROVED,
        pendingReason: PendingEnrollmentReason.CUSTOMER_SIGNATURE,
        subscriberApprovalRequiredByDate: "1990-05-05",
    } as Enrollments;
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EnrollmentHelperService);
        jest.useFakeTimers();
        jest.setSystemTime(new Date("1990/09/09"));
    });

    describe("EnrollmentHelperService", () => {
        it("should be created", () => {
            expect(service).toBeTruthy();
        });
    });

    describe("getEnrollmentStatus()", () => {
        it("should get enrollment status as 'Declined' with plan belongs to declined", () => {
            const status = service.getEnrollmentStatus(enrollmentData);
            expect(status).toBe("Declined");
        });

        it("should get enrollment status as 'Application denied' with enrolled status as Denied ", () => {
            const status = service.getEnrollmentStatus({ ...enrollmentData, status: EnrollmentStatusType.DENIED });
            expect(status).toBe("Application denied");
        });
        it("should get enrollment status as 'Lapsed' for lapsed policy", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                reinstatement: ReinstatementType.MANDATORY,
                status: EnrollmentStatusType.TERMINATED,
            });
            expect(status).toBe("Lapsed");
        });
        it("should get enrollment status as 'Ended' for terminated policy", () => {
            const status = service.getEnrollmentStatus({ ...enrollmentData, status: EnrollmentStatusType.TERMINATED });
            expect(status).toBe("Ended");
        });
        it("should get enrollment status as 'Void' for cancelled policy", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                validity: { effectiveStarting: "1991-01-01" },
                status: EnrollmentStatusType.CANCELLED,
            });
            expect(status).toBe("Void");
        });
        it("should get enrollment status as 'Ended' with ended policy", () => {
            const status = service.getEnrollmentStatus({ ...enrollmentData, status: EnrollmentStatusType.CANCELLED });
            expect(status).toBe("Ended");
        });
        it("should get enrollment status as 'Enrolled' with withdrawn policy", () => {
            const status = service.getEnrollmentStatus({ ...enrollmentData, status: EnrollmentStatusType.WITHDRAWN });
            expect(status).toBe("Enrolled");
        });
        describe("test suit when enrolled plan is expired", () => {
            beforeEach(() => {
                jest.useRealTimers();
            });
            it("should get enrollment status as 'Ended' with having enrolled plan is expired", () => {
                const status = service.getEnrollmentStatus({
                    ...enrollmentData,
                    plan: {
                        characteristics: [Characteristics.STACKABLE],
                    } as Plan,
                });
                expect(status).toBe("Ended");
            });
            afterAll(() => {
                jest.useFakeTimers();
                jest.setSystemTime(new Date("1990/09/09"));
            });
        });
        it("should get enrollment status as 'Enrolled' having enrolled plan not expired", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                validity: {
                    effectiveStarting: "1989-09-09",
                },
                plan: {
                    characteristics: [Characteristics.STACKABLE],
                } as Plan,
            });
            expect(status).toBe("Enrolled");
        });
        it("should get enrollment status as 'Active' having policy is effective currently", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                pendingReason: PendingEnrollmentReason.CARRIER_APPROVAL,
                validity: {
                    effectiveStarting: "1989-09-09",
                },
                plan: {
                    characteristics: [Characteristics.STACKABLE],
                } as Plan,
            });
            expect(status).toBe("Active");
        });
        it("should get enrollment status as 'Void' with subscriberApprovalRequiredByDate is current date", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                subscriberApprovalRequiredByDate: "1990-09-09",
                validity: {
                    effectiveStarting: "1989-09-09",
                },
                plan: {
                    characteristics: [Characteristics.STACKABLE],
                } as Plan,
            });
            expect(status).toBe("Void");
        });
        it("should get enrollment status as 'Enrolled' with pending reason of CARRIER_APPROVAL ", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                pendingReason: PendingEnrollmentReason.CARRIER_APPROVAL,
                status: EnrollmentStatusType.PENDING,
            });
            expect(status).toBe("Enrolled");
        });
        it("should get enrollment status as 'Enrolled' with pending reason of ADMIN_APPROVAL ", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                pendingReason: PendingEnrollmentReason.ADMIN_APPROVAL,
                status: EnrollmentStatusType.PENDING,
            });
            expect(status).toBe("Enrolled");
        });
        it("should get enrollment status as 'Enrolled' with pending reason of THIRD_PARTY_APPROVAL", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                pendingReason: PendingEnrollmentReason.THIRD_PARTY_APPROVAL,
                status: EnrollmentStatusType.PENDING,
            });
            expect(status).toBe("Enrolled");
        });
        it("should get enrollment status as 'Enrolled' with pending reason of PDA_COMPLETION", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                pendingReason: PendingEnrollmentReason.PDA_COMPLETION,
                status: EnrollmentStatusType.PENDING,
            });
            expect(status).toBe("Enrolled");
        });
        it("should get enrollment status as 'Enrolled' with pending reason of INCOMPLETE_MISSING_EAA", () => {
            const status = service.getEnrollmentStatus({
                ...enrollmentData,
                pendingReason: PendingEnrollmentReason.INCOMPLETE_MISSING_EAA,
                status: EnrollmentStatusType.PENDING,
            });
            expect(status).toBe("Enrolled");
        });
        it("should get enrollment status as 'Enrolled' with pending reason of PENDING ", () => {
            const status = service.getEnrollmentStatus({ ...enrollmentData, status: EnrollmentStatusType.PENDING });
            expect(status).toBe("Enrolled");
        });
    });
});
