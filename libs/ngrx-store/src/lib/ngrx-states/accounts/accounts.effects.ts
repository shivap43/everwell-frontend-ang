import { Injectable } from "@angular/core";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";
import { Account, CarrierId, PayFrequency, RiskClass, Exceptions } from "@empowered/constants";
import { combineLatest, Observable } from "rxjs";
import {
    AccountListService,
    AccountProfileService,
    AccountService,
    AdminService,
    AflacService,
    DualPeoRiskClassIds,
    ExceptionsService,
} from "@empowered/api";
import { HttpErrorResponse } from "@angular/common/http";

import * as AccountsActions from "./accounts.actions";
import { GroupAttribute, GroupAttributeRecord } from "./accounts.model";
import { getAccountEntityId, getExceptionsEntityId } from "./accounts.state";
import { getSerializableError } from "../../ngrx.store.helpers";

@Injectable()
export class AccountsEffects {
    loadAccount$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadAccount),
            fetch({
                id: (identifiers) => getAccountEntityId(identifiers),
                run: ({ mpGroup }) =>
                    this.accountListService.getAccount(String(mpGroup)).pipe(
                        map((account: Account) =>
                            AccountsActions.loadAccountSuccess({
                                accountsEntity: {
                                    identifiers: { mpGroup },
                                    data: account,
                                },
                            }),
                        ),
                    ),

                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadAccountFailure({
                        error: {
                            identifiers: { mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadPayFrequencies$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadPayFrequencies),
            fetch({
                id: (identifiers) => getAccountEntityId(identifiers),
                run: ({ mpGroup }) =>
                    this.accountService.getPayFrequencies(String(mpGroup)).pipe(
                        map((payFrequencies: PayFrequency[]) =>
                            AccountsActions.loadPayFrequenciesSuccess({
                                payFrequenciesEntity: {
                                    identifiers: { mpGroup },
                                    data: payFrequencies,
                                },
                            }),
                        ),
                    ),

                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadPayFrequenciesFailure({
                        error: {
                            identifiers: { mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadGroupAttributeRecord$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadGroupAttributeRecord),
            fetch({
                id: (identifiers) => getAccountEntityId(identifiers),
                run: ({ groupAttributeNames, mpGroup }) =>
                    // We have to cast to avoid return type used in the AccountService.getGroupAttributesByName
                    // The 'GroupAttribute' this Service uses isn't reliable
                    (this.accountService.getGroupAttributesByName(groupAttributeNames, mpGroup) as Observable<GroupAttribute[]>).pipe(
                        map((groupAttributes: GroupAttribute[]) => {
                            // Create a Record from the Array of GroupAttribute using attribute property as its key
                            const groupAttributeRecord: GroupAttributeRecord = groupAttributeNames.reduce<GroupAttributeRecord>(
                                (record, groupAttributeName) => {
                                    // Find GroupAttribute using attribute, fallback to null if there's no match
                                    const groupAttribute: GroupAttribute | null =
                                        groupAttributes.find(({ attribute }) => attribute === groupAttributeName) ?? null;

                                    // Add GroupAttribute or null in Record using GroupAttribute.attribute as its key
                                    record[groupAttributeName] = groupAttribute;
                                    return record;
                                },
                                {},
                            );

                            return AccountsActions.loadGroupAttributeRecordSuccess({
                                groupAttributeRecordEntity: { identifiers: { mpGroup }, data: groupAttributeRecord },
                            });
                        }),
                    ),
                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadGroupAttributeRecordFailure({
                        error: { identifiers: { mpGroup }, data: httpErrorResponse.error },
                    }),
            }),
        ),
    );

    loadRiskClasses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadRiskClasses),
            fetch({
                id: (identifiers) => getAccountEntityId(identifiers),
                run: ({ mpGroup }) =>
                    this.accountProfileService.getAccountCarrierRiskClasses(CarrierId.AFLAC, mpGroup).pipe(
                        map((riskClasses: RiskClass[]) =>
                            AccountsActions.loadRiskClassesSuccess({
                                riskClassesEntity: {
                                    identifiers: { mpGroup },
                                    data: riskClasses,
                                },
                            }),
                        ),
                    ),
                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadRiskClassesFailure({
                        error: {
                            identifiers: { mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadDualPeoRiskClassIdsSet$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadDualPeoRiskClassIdsSet),
            fetch({
                id: (identifiers) => getAccountEntityId(identifiers),
                run: ({ mpGroup }) =>
                    combineLatest([
                        this.aflacService.getDualPeoSelection(String(mpGroup)),
                        this.aflacService.getDualPeoSelection(
                            String(mpGroup),
                            CarrierId.AFLAC,
                        ) as unknown as Observable<DualPeoRiskClassIds>,
                    ]).pipe(
                        map(([dualPeoRiskClassIds, aflacCarrierDualPeoRiskClassIds]) =>
                            AccountsActions.loadDualPeoRiskClassIdsSetSuccess({
                                dualPeoRiskClassIdsSetsEntity: {
                                    identifiers: { mpGroup },
                                    data: {
                                        dualPeoRiskClassIds,
                                        aflacCarrierDualPeoRiskClassIds,
                                    },
                                },
                            }),
                        ),
                    ),
                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadDualPeoRiskClassIdsSetFailure({
                        error: {
                            identifiers: { mpGroup },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadExceptions$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadExceptions),
            fetch({
                id: (identifiers) => getExceptionsEntityId(identifiers),
                run: ({ mpGroup, exceptionType }) =>
                    this.exceptionsService.getExceptions(String(mpGroup), exceptionType).pipe(
                        map((exceptions: Exceptions[] | null) =>
                            AccountsActions.loadExceptionsSuccess({
                                exceptionsEntity: {
                                    identifiers: { mpGroup, exceptionType },
                                    data: exceptions ?? [],
                                },
                            }),
                        ),
                    ),
                onError: ({ mpGroup, exceptionType }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadExceptionsFailure({
                        error: {
                            identifiers: { mpGroup, exceptionType },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    // Load account admin
    loadAccountAdmins$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AccountsActions.loadAccountAdmins),
            fetch({
                id: (identifiers) => getAccountEntityId(identifiers),
                run: ({ mpGroup }) =>
                    this.adminService.getAccountAdmins(mpGroup, "roleId,reportsToId").pipe(
                        map((accountAdmins) =>
                            AccountsActions.loadAccountAdminsSuccess({
                                accountAdminsEntity: {
                                    identifiers: {
                                        mpGroup,
                                    },
                                    data: accountAdmins,
                                },
                            }),
                        ),
                    ),
                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    AccountsActions.loadAccountAdminsFailure({
                        error: {
                            identifiers: {
                                mpGroup,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    constructor(
        private readonly actions$: Actions,
        private readonly accountListService: AccountListService,
        private readonly accountService: AccountService,
        private readonly accountProfileService: AccountProfileService,
        private readonly aflacService: AflacService,
        private readonly exceptionsService: ExceptionsService,
        private readonly adminService: AdminService,
    ) {}
}
