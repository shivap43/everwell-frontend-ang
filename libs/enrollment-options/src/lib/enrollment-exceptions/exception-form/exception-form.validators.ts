import { ValidatorFn, FormGroup, ValidationErrors } from "@angular/forms";
import { ExceptionType } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { DateRangeErrorType } from "../../models/manage-call-center.model";

export class ExceptionFormValidator {
    constructor(private readonly dateService: DateService) {}

    /**
     * Validates the add / edit exception form group
     * based on the selected dates and exception type.
     *
     * @param callCenterEffectiveStarting active VCC start date
     * @param callCenterExpiresAfter active VCC end date
     * @returns error indicating the type of overlap if there is one; null otherwise
     */
    dateRangeOverlapValidator(callCenterEffectiveStarting: Date, callCenterExpiresAfter: Date): ValidatorFn {
        return (group: FormGroup): ValidationErrors | null => {
            const validity = group?.controls.validity as FormGroup;
            if (!validity) {
                return null;
            }
            const exceptionStart =
                validity.controls.effectiveStarting.value && this.dateService.toDate(validity.controls.effectiveStarting.value);
            const exceptionEnd = validity.controls.expiresAfter.value && this.dateService.toDate(validity.controls.expiresAfter.value);

            // validates dates as a range
            const exceptionRangeOverlap =
                group?.controls.type.value === ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS &&
                callCenterExpiresAfter &&
                this.dateService.isBefore(exceptionStart, callCenterEffectiveStarting) &&
                this.dateService.checkIsAfter(exceptionEnd, callCenterExpiresAfter);

            // validates start and end dates individually
            const [startDateInvalid, endDateInvalid] = [exceptionStart, exceptionEnd].map(
                (date) =>
                    exceptionRangeOverlap ||
                    this.exceptionDateInvalid(date, group?.controls.type.value, callCenterEffectiveStarting, callCenterExpiresAfter),
            );

            let type;
            if (startDateInvalid) {
                type = endDateInvalid ? DateRangeErrorType.BOTH : DateRangeErrorType.START;
            } else if (endDateInvalid) {
                type = DateRangeErrorType.END;
            }
            return type ? { overlap: { type } } : null;
        };
    }

    /**
     * Returns whether the input date is valid based on
     * the active Virtual Contact Center's (VCC) dates.
     *
     * @param exceptionDate exception start or end date
     * @param exceptionType exception type
     * @param callCenterEffectiveStarting active VCC start date
     * @param callCenterExpiresAfter active VCC end date
     * @returns true if date is invalid
     */
    exceptionDateInvalid(
        exceptionDate: Date,
        exceptionType: ExceptionType,
        callCenterEffectiveStarting: Date,
        callCenterExpiresAfter: Date,
    ): boolean {
        if (!exceptionDate) {
            return false;
        }
        const exceptionDateIsBetweenVCCDates =
            callCenterExpiresAfter && this.dateService.isBetween(callCenterEffectiveStarting, callCenterExpiresAfter, exceptionDate);
        // PIN signature exception must NOT overlap with the VCC.
        if (exceptionType === ExceptionType.ALLOWED_ENROLLMENT_EXCEPTIONS) {
            if (callCenterExpiresAfter) {
                // If  has end date
                if (this.dateService.isBeforeOrIsEqual(callCenterEffectiveStarting)) {
                    // If VCC is ongoing,
                    // there is an overlap if the input date falls before VCC's end date
                    return this.dateService.isBeforeOrIsEqual(exceptionDate, callCenterExpiresAfter);
                }
                // Call canter is in the future.
                // Overlap if date falls between VCC's dates
                return exceptionDateIsBetweenVCCDates;
            }
            // If VCC does not expire, there is an overlap if the exception date is after VCC start
            return this.dateService.getIsAfterOrIsEqual(exceptionDate, callCenterEffectiveStarting);
        }
        // Disability PIN signature exception must be between VCC's dates.
        if (exceptionType === ExceptionType.ALLOWED_DISABILITY_ENROLLMENT) {
            return (
                (callCenterExpiresAfter && !exceptionDateIsBetweenVCCDates) ||
                this.dateService.isBefore(exceptionDate, callCenterEffectiveStarting)
            );
        }
        return false;
    }
}
