import { ApplicationStatusTypes } from "@empowered/api";
import {
    AlertType,
    AsyncData,
    AsyncStatus,
    CombinedOfferingWithCartAndEnrollment,
    CrossBorderAlertType,
    ErrorMessage,
    PlanOfferingPricingsIdentifiers,
    MissingInfoType,
    PlanOfferingPricing,
} from "@empowered/constants";
import { DefaultProjectorFn, MemoizedSelector } from "@ngrx/store";

/**
 * Various statuses of ended coverage
 */
export enum EndCoverageStatus {
    ACTIVE = "Active",
    ENDED = "Ended",
    END_COVERAGE_REQUESTED = "End coverage requested",
}

export interface PlansContainerData {
    combinedOffering: CombinedOfferingWithCartAndEnrollment;
    enrollmentRestrictionType: CrossBorderAlertType;
    allPlansRestricted: boolean;
    missingInformation: MissingInfoType;
    // indicates enrollment status
    enrollmentStatus: ApplicationStatusTypes;
}

/**
 * Used to dispatch PlanOfferingPricings NGRX Action. Includes `selector` property so we can use `NGRXStore.dispatchIfIdle()`
 *
 * By passing the selector, we can avoid dispatching the NGRX Action if the selector isn't IDLE
 */
export interface PlanOfferingPricingsActionProperties {
    identifiers: PlanOfferingPricingsIdentifiers;
    // eslint-disable-next-line @typescript-eslint/ban-types
    selector: MemoizedSelector<object, AsyncData<PlanOfferingPricing[]>, DefaultProjectorFn<AsyncData<PlanOfferingPricing[]>>>;
}

// TODO [Types]: libs/api/src/lib/services/shopping/enums/plan-type.enum.ts has the same type but it doesn't include the other plan types
// We should update it to include them
export enum PlanType {
    // Redirect Plans are also known as Carrier Specific Plans
    REDIRECT = "REDIRECT",
    BUCKET = "BUCKET",
    STANDARD = "STANDARD",
}

// Used in producer-shop.component
export enum ZeroStateButtonType {
    QLE = "QLE",
    BENEFITS_OFFERING = "BenefitOfferings",
    EMPLOYEE = "Employee",
}
export interface ZeroStateButton {
    errorMessage: string;
    planOfferingAsyncStatus: AsyncStatus;
    shopLabelText: string;
    buttonType?: ZeroStateButtonType | null;
    buttonText?: string | null;
}

/**
 * Used to display error message using AlertComponent
 */
export interface AlertMessage extends ErrorMessage {
    alertType: AlertType;
}
