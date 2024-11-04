import { BenefitsOfferingService, AccountService, ExceptionsService } from "@empowered/api";
import { Injectable } from "@angular/core";
import { combineLatest, iif, Observable, of } from "rxjs";
import { DatePipe } from "@angular/common";
import { catchError, map, switchMap } from "rxjs/operators";
import {
    Characteristics,
    DateFormats,
    Exceptions,
    ExceptionType,
    ExceptionTypeCategory,
    PlanChoice,
    ProductId,
    Validity,
} from "@empowered/constants";
import { StaticUtilService } from "../state-services/static-util.service";
import { DateService } from "@empowered/date";

interface CallCenter8x8Restrictions {
    planChoices?: PlanChoice[];
    pinSignatureExceptions?: Exceptions[];
    callCenterDisabilityEnrollmentRestricted: boolean;
}

@Injectable({
    providedIn: "root",
})
export class ExceptionBusinessService {
    constructor(
        private readonly exceptionService: ExceptionsService,
        private readonly datePipe: DatePipe,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly accountService: AccountService,
        private readonly dateService: DateService,
    ) {}

    /**
     * function to get All Selected VAS Exceptions
     * @param mpGroup
     * @returns observable<Exceptions[]>
     */
    getSelectedVasExceptions(mpGroup: string): Observable<Exceptions[]> {
        return this.exceptionService
            .getExceptions(mpGroup)
            .pipe(
                map((exceptions) =>
                    exceptions.filter((exception) =>
                        this.dateService.checkIsAfter(this.dateService.toDate(exception.validity.expiresAfter.toString())),
                    ),
                ),
            );
    }

    /**
     * This method is used to fetch exceptions from API
     *
     * @param mpGroup is the group id of the account
     * @returns VAS exceptions
     */
    getVasExceptions(mpGroup: string): Observable<Exceptions[]> {
        return this.exceptionService
            .getExceptions(mpGroup, null, [ExceptionTypeCategory.VAS])
            .pipe(
                map((exceptions) =>
                    exceptions.filter((exception) =>
                        this.dateService.checkIsAfter(this.dateService.toDate(exception.validity.expiresAfter.toString())),
                    ),
                ),
            );
    }

    /**
     * This method is used to filter exceptions
     * @param mpGroup is the group id of the account
     * @returns an observable exceptions, Observable<Exceptions[]>
     */
    filterExceptions(mpGroup: number): Observable<Exceptions[]> {
        return this.exceptionService.getExceptions(mpGroup.toString(), undefined, [ExceptionTypeCategory.VAS]).pipe(
            map((exceptions) =>
                exceptions
                    .filter((exception) =>
                        this.dateService.checkIsAfter(this.dateService.toDate(exception.validity.expiresAfter.toString())),
                    )
                    .map((exception) => ({
                        ...exception,
                        validity: {
                            effectiveStarting: this.datePipe.transform(exception.validity.effectiveStarting, DateFormats.MONTH_DAY_YEAR),
                            expiresAfter: this.datePipe.transform(exception.validity.expiresAfter, DateFormats.MONTH_DAY_YEAR),
                        },
                        isValid: true,
                    })),
            ),
        );
    }

    /**
     * Returns allowed enrollment exceptions.
     *
     * @param mpGroup group id
     * @returns allowed enrollment exceptions
     */
    getPinSignatureExceptions(mpGroup: number): Observable<Exceptions[]> {
        return this.exceptionService.getExceptions(mpGroup.toString(), undefined, [ExceptionTypeCategory.ENROLLMENT]).pipe(
            // This is to work around null response returned by this endpoint
            map((exceptions) => exceptions || []),
            catchError((error) => of([])),
        );
    }

    /**
     * Returns whether call center enrollment for disability products is disabled.
     *
     * @param mpGroup group id
     * @param callCenter8x8EnabledConfig 8x8 toggle config name
     * @param callCenter8x8DisabilityMinEmployeesConfig config that specifies min number
     * of employees for an account to be eligible for call center disability enrollment
     * @param callCenter8x8TransmittalAllowed config that specifies call centers that allow 8x8 transmittal
     * @param staticUtil instance of StaticUtilService (this is to get around circular dependencies)
     * @param numberOfActiveEmployees number of active employees on the account
     * @returns info about whether restriction applies, plan choices and added pin signature exceptions
     */
    callCenter8x8DisabilityRestricted(
        mpGroup: number,
        callCenter8x8EnabledConfig: string,
        callCenter8x8DisabilityMinEmployeesConfig: string,
        callCenter8x8TransmittalAllowed: string,
        staticUtil: StaticUtilService,
        numberOfActiveEmployees: number,
    ): Observable<CallCenter8x8Restrictions> {
        return staticUtil.cacheConfigEnabled(callCenter8x8EnabledConfig).pipe(
            switchMap((featureEnabled) =>
                iif(
                    () => featureEnabled,
                    combineLatest([
                        this.benefitsOfferingService.getPlanChoices(false, false, mpGroup),
                        this.getPinSignatureExceptions(mpGroup),
                        this.accountService.getAccountCallCenters(mpGroup),
                        staticUtil.cacheConfigValue(callCenter8x8DisabilityMinEmployeesConfig),
                        staticUtil.cacheConfigValue(callCenter8x8TransmittalAllowed),
                    ]),
                    of([]),
                ),
            ),
            map(
                ([
                    allPlanChoices,
                    pinSignatureExceptions,
                    accountCallCenters,
                    disabilityEnrollmentMinEmployees,
                    callCentersWith8x8Transmittal,
                ]) => {
                    if (allPlanChoices && pinSignatureExceptions && disabilityEnrollmentMinEmployees) {
                        const planChoices = allPlanChoices.filter(
                            (planChoice) => !planChoice.plan?.characteristics?.includes(Characteristics.DECLINE),
                        );
                        const accountHasValid8x8CallCenter = accountCallCenters.some(
                            (accountCallCenter) =>
                                accountCallCenter.callCenterId === +callCentersWith8x8Transmittal &&
                                this.dateService.isBeforeOrIsEqual(accountCallCenter.validity.effectiveStarting) &&
                                (!accountCallCenter.validity.expiresAfter ||
                                    this.dateService.checkIsTodayOrAfter(accountCallCenter.validity.expiresAfter)),
                        );
                        return {
                            planChoices,
                            callCenterDisabilityEnrollmentRestricted:
                                accountHasValid8x8CallCenter &&
                                this.isDisabilityEnrollmentRestricted(
                                    numberOfActiveEmployees,
                                    +disabilityEnrollmentMinEmployees,
                                    pinSignatureExceptions,
                                    planChoices,
                                ),
                            pinSignatureExceptions,
                        };
                    }
                    return {
                        callCenterDisabilityEnrollmentRestricted: false,
                    };
                },
            ),
        );
    }

    /**
     * Returns whether disability enrollment is restricted for VCC.
     *
     * @param numberOfActiveEmployees number of active employees on the account
     * @param disabilityEnrollmentMinEmployees min number of employees for an account
     *  to be eligible for call center disability enrollment
     * @param pinSignatureExceptions list of allowed enrollment exceptions
     * @param planChoices plans chosen for benefit offering
     * @param callCenterStartDate call center validity start date
     * @param callCenterEndDate call center validity end date
     * @returns whether disability enrollment is restricted for VCC
     */
    isDisabilityEnrollmentRestricted(
        numberOfActiveEmployees: number,
        disabilityEnrollmentMinEmployees: number,
        pinSignatureExceptions: Exceptions[],
        planChoices: PlanChoice[],
        virtualCallCenterValidity?: Validity,
    ): boolean {
        return (
            // Account does not have the minimum required number of members
            numberOfActiveEmployees < disabilityEnrollmentMinEmployees &&
            // and no valid Disability PIN signature exception exists
            pinSignatureExceptions?.every(
                (exception) =>
                    exception.type !== ExceptionType.ALLOWED_DISABILITY_ENROLLMENT ||
                    !this.isDisabilityPINSignatureExceptionValid(exception.validity, virtualCallCenterValidity),
            ) &&
            // and benefits offering includes disability plans
            planChoices?.some((planChoice) => planChoice.plan.productId === ProductId.SHORT_TERM_DISABILITY)
        );
    }

    /**
     * Returns whether a disability PIN signature exception is valid
     * either during a specified period (virtual call center validity) or on the current date.
     *
     * @param exceptionValidity disability PIN signature exception
     * @param virtualCallCenterValidity (optional) virtual call center validity
     * @returns true if the exception is valid
     */
    isDisabilityPINSignatureExceptionValid(exceptionValidity: Validity, virtualCallCenterValidity?: Validity): boolean {
        if (virtualCallCenterValidity && !virtualCallCenterValidity.expiresAfter) {
            return false;
        }
        // If call center validity has been provided, exception is not valid if at some date
        // within the call center validity period does not fall within the exception period.

        // If call center validity has NOT been provided, check if the exception is valid for the current date.
        // moment(undefined) = current date
        // replaced moment(undefined) with new Date()
        return (
            this.dateService.isBeforeOrIsEqual(
                this.dateService.toDate(exceptionValidity.effectiveStarting),
                this.dateService.toDate(virtualCallCenterValidity?.effectiveStarting || Date.now()),
            ) &&
            this.dateService.getIsAfterOrIsEqual(
                this.dateService.toDate(exceptionValidity.expiresAfter || Date.now()),
                this.dateService.toDate(virtualCallCenterValidity?.expiresAfter || Date.now()),
            )
        );
    }
}
