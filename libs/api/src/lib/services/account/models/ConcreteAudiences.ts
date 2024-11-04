import { AbstractAudience } from "./AbstractAudience";
import { EmploymentStatus } from "../../member/enums/employment-status.enum";

export interface OrgAudience extends AbstractAudience {
    orgId: number;
    readonly name?: string;
}

export interface ClassAudience extends AbstractAudience {
    classId: number;
    readonly className?: string;
    classTypeId: number;
    readonly classTypeName?: string;
}

export interface RegionAudience extends AbstractAudience {
    regionId: number;
    readonly regionName?: string;
    readonly regionTypeId?: number;
    readonly regionTypeName?: string;
}

export interface MemberSpecificAudience extends AbstractAudience {
    identifiers?: string[];
    memberIds?: number[];
}

export interface EmploymentStatusAudience extends AbstractAudience {
    status: EmploymentStatus;
}

export interface EnrolledProductAudience extends AbstractAudience {
    enrolledProductId: number;
    readonly name?: string;
}

export interface EnrolledPlanAudience extends AbstractAudience {
    enrolledPlanId: number;
    readonly planName?: string;
    readonly enrolledProductId?: number;
    readonly productName?: string;
}

export interface QualifierAudience extends AbstractAudience {
    qualifierTypeId: number;
    readonly name?: string;
    response: string;
}

export interface EnrollmentQuestionResponseAudience extends AbstractAudience {
    planQuestionId: number;
    readonly name?: string;
    response: string;
}

export function GET_AUDIENCE_CONTEXT(audience: AbstractAudience): any {
    switch (audience.type) {
        case "CLAZZ":
            return (audience as ClassAudience).classTypeId;
        case "REGION":
            return (audience as RegionAudience).regionTypeId;
        case "ENROLLMENT_PLAN":
            return (audience as EnrolledPlanAudience).enrolledProductId;
        default:
            return null;
    }
}

export function COMPARE_AUDIENCE(audienceOne: AbstractAudience, audienceTwo: AbstractAudience): boolean {
    if (audienceOne == null || audienceTwo == null || audienceOne.type !== audienceTwo.type) {
        return false;
    }

    switch (audienceOne.type) {
        case "ORG":
            return COMPARE_OrgAudience(audienceOne as OrgAudience, audienceTwo as OrgAudience);
        case "SSN":
        case "EMPLOYEE_ID":
            return COMPARE_MemberSpecificAudience(
                audienceOne as MemberSpecificAudience,
                audienceTwo as MemberSpecificAudience
            );
        case "CLAZZ":
            return COMPARE_ClassAudience(audienceOne as ClassAudience, audienceTwo as ClassAudience);
        case "REGION":
            return COMPARE_RegionAudience(audienceOne as RegionAudience, audienceTwo as RegionAudience);
        case "EMPLOYMENT_STATUS":
            return COMPARE_EmploymentStatusAudience(
                audienceOne as EmploymentStatusAudience,
                audienceTwo as EmploymentStatusAudience
            );
        case "ENROLLMENT_PRODUCT":
            return COMPARE_EnrolledProductAudience(
                audienceOne as EnrolledProductAudience,
                audienceTwo as EnrolledProductAudience
            );
        case "ENROLLMENT_PLAN":
            return COMPARE_EnrolledPlanAudience(
                audienceOne as EnrolledPlanAudience,
                audienceTwo as EnrolledPlanAudience
            );
        case "QUALIFIER":
            return COMPARE_QualifierAudience(audienceOne as QualifierAudience, audienceTwo as QualifierAudience);
        case "ENROLLMENT_QUESTION_RESPONSE":
            return COMPARE_EnrollmentQuestionResponseAudience(
                audienceOne as EnrollmentQuestionResponseAudience,
                audienceTwo as EnrollmentQuestionResponseAudience
            );
    }
}

export function COMPARE_OrgAudience(audienceOne: OrgAudience, audienceTwo: OrgAudience): boolean {
    return audienceOne.orgId === audienceTwo.orgId;
}

export function COMPARE_ClassAudience(audienceOne: ClassAudience, audienceTwo: ClassAudience): boolean {
    return audienceOne.classId === audienceTwo.classId;
}

export function COMPARE_RegionAudience(audienceOne: RegionAudience, audienceTwo: RegionAudience): boolean {
    return audienceOne.regionId === audienceTwo.regionId;
}

export function COMPARE_MemberSpecificAudience(
    audienceOne: MemberSpecificAudience,
    audienceTwo: MemberSpecificAudience
): boolean {
    // TDOD :: determine if these objects can be compared
    return false;
}

export function COMPARE_EmploymentStatusAudience(
    audienceOne: EmploymentStatusAudience,
    audienceTwo: EmploymentStatusAudience
): boolean {
    return audienceOne.status === audienceTwo.status;
}

export function COMPARE_EnrolledProductAudience(
    audienceOne: EnrolledProductAudience,
    audienceTwo: EnrolledProductAudience
): boolean {
    return audienceOne.enrolledProductId === audienceTwo.enrolledProductId;
}

export function COMPARE_EnrolledPlanAudience(
    audienceOne: EnrolledPlanAudience,
    audienceTwo: EnrolledPlanAudience
): boolean {
    return audienceOne.enrolledPlanId === audienceTwo.enrolledPlanId;
}

export function COMPARE_QualifierAudience(audienceOne: QualifierAudience, audienceTwo: QualifierAudience): boolean {
    return audienceOne.qualifierTypeId === audienceTwo.qualifierTypeId && audienceOne.response === audienceTwo.response;
}

export function COMPARE_EnrollmentQuestionResponseAudience(
    audienceOne: EnrollmentQuestionResponseAudience,
    audienceTwo: EnrollmentQuestionResponseAudience
): boolean {
    return audienceOne.planQuestionId === audienceTwo.planQuestionId && audienceOne.response === audienceTwo.response;
}
