import { AccountCallCenter, AccountService, ExceptionsService } from "@empowered/api";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { EnrollmentOptionStateModel } from "./enrollment-options.model";
import {
    SetAccountCallCenters,
    SetAllowedExceptionTypes,
    SetOfferingPlanChoices,
    SetPINSignatureExceptions,
} from "./enrollment-options.action";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { LanguageService } from "@empowered/language";
import { Exceptions, PlanChoice, ExceptionTypeCategory, PolicyOwnershipType } from "@empowered/constants";
import { ExceptionBusinessService } from "../state-services/exception-business.service";
import { DateService } from "@empowered/date";

const defaultState: EnrollmentOptionStateModel = {
    pinSignatureExceptions: [],
    planChoices: [],
    accountCallCenters: [],
    allowedExceptionTypes: [],
};

@State<EnrollmentOptionStateModel>({
    name: "EnrollmentOptionsState",
    defaults: defaultState,
})
@Injectable()
export class EnrollmentOptionsState {
    constructor(
        private readonly exceptionsService: ExceptionsService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {}
    /**
     * method to get pin signature exceptions
     * @param state enrollment option state model
     * @return pin signature exceptions
     */
    @Selector()
    static getPINSignatureExceptions(state: EnrollmentOptionStateModel): Exceptions[] {
        return state.pinSignatureExceptions;
    }

    /**
     * Get allowed exception types for an account.
     *
     * @param state enrollment options state context
     * @returns allowed exception types
     */
    @Selector()
    static getAllowedExceptionTypes(state: EnrollmentOptionStateModel): string[] {
        return state.allowedExceptionTypes;
    }

    /**
     * Gets plans chosen for the benefit offering.
     *
     * @param state enrollment options state context
     * @returns plans chosen for the benefit offering
     */
    @Selector()
    static getOfferingPlanChoices(state: EnrollmentOptionStateModel): PlanChoice[] {
        return state.planChoices;
    }

    /**
     * Gets account call centers.
     *
     * @param state enrollment options state context
     * @returns account call centers
     */
    @Selector()
    static getAccountCallCenters(state: EnrollmentOptionStateModel): AccountCallCenter[] {
        return state.accountCallCenters;
    }

    /**
     * Get information about the type of plans a benefit offering contains.
     *
     * @param state enrollment options state context
     * @returns plan policy ownership type details
     */
    @Selector()
    static getPolicyOwnershipTypeDetails(state: EnrollmentOptionStateModel): {
        onlyIndividualPlans: boolean;
        onlyGroupPlans: boolean;
    } {
        return {
            onlyIndividualPlans: state.planChoices?.every((choice) => choice.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL),
            onlyGroupPlans: state.planChoices?.every((choice) => choice.plan.policyOwnershipType === PolicyOwnershipType.GROUP),
        };
    }

    /**
     * method to set pin signature exceptions
     * @param context context of Enrollment option state model
     * @param pinSignatureExceptions pin signature exceptions
     */
    @Action(SetPINSignatureExceptions)
    setPINSignatureExceptions(
        context: StateContext<EnrollmentOptionStateModel>,
        { mpGroup }: SetPINSignatureExceptions,
    ): Observable<Exceptions[]> {
        return this.exceptionBusinessService.getPinSignatureExceptions(mpGroup).pipe(
            tap((exceptions) =>
                context.patchState({
                    pinSignatureExceptions: exceptions.map((exception) => ({
                        ...exception,
                        name: this.language.fetchPrimaryLanguageValue(`primary.portal.exceptions.exceptionTypes.${exception.type}`),
                    })),
                }),
            ),
        );
    }

    /**
     * Set allowed exception types.
     *
     * @param context enrollment options state context
     * @returns allowed exception types for the current group
     */
    @Action(SetAllowedExceptionTypes)
    setAllowedExceptionTypes(context: StateContext<EnrollmentOptionStateModel>): Observable<string[]> {
        return this.exceptionsService.getAllowedExceptionTypes([ExceptionTypeCategory.ENROLLMENT]).pipe(
            tap((allowedExceptionTypes) =>
                context.patchState({
                    allowedExceptionTypes,
                }),
            ),
        );
    }

    /**
     * Sets account call centers.
     *
     * @param context enrollment options state context
     * @param param1 mpGroup current group id
     * @param param2 expand if defined, should be "callCenter" to get info about the call center
     * @returns account call centers
     */
    @Action(SetAccountCallCenters)
    setAccountCallCenters(
        context: StateContext<EnrollmentOptionStateModel>,
        { mpGroup, expand }: SetAccountCallCenters,
    ): Observable<AccountCallCenter[]> {
        return this.accountService.getAccountCallCenters(mpGroup, expand).pipe(
            tap((accountCallCenters) => {
                context.patchState({
                    accountCallCenters: accountCallCenters.sort(
                        (first, second) =>
                            this.dateService.toDate(second.validity.effectiveStarting).getTime() -
                            this.dateService.toDate(first.validity.effectiveStarting).getTime(),
                    ),
                });
            }),
        );
    }

    /**
     * Sets plans chosen for the benefit offering.
     *
     * @param context enrollment options state context
     * @param param1 plans chosen for the benefit offering
     */
    @Action(SetOfferingPlanChoices)
    setOfferingPlanChoices(context: StateContext<EnrollmentOptionStateModel>, { planChoices }: EnrollmentOptionStateModel): void {
        context.patchState({ planChoices });
    }
}
