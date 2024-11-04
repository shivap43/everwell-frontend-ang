import { Router, ActivatedRoute } from "@angular/router";
import { tap, switchMap, map, filter, withLatestFrom, catchError, shareReplay } from "rxjs/operators";
import {
    AccountCallCenter,
    AccountDetails,
    StaticService,
    CallCenter,
    ProducerService,
    AccountList,
    BenefitsOfferingService,
    AccountService,
    ProducerListItem,
    PageableResponse,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ManageCallCenterDialogComponent } from "./manage-call-center-dialog/manage-call-center-dialog.component";
import { ApprovalDialogComponent } from "./approval-dialog/approval-dialog.component";
import { LanguageService } from "@empowered/language";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Observable, Subscription, of, forkJoin, combineLatest } from "rxjs";
import { ConfigName, AccountImportTypes, Portals, Exceptions, PlanChoice } from "@empowered/constants";
import { EmpoweredSheetService } from "@empowered/common-services";
import { HttpErrorResponse } from "@angular/common/http";
import { ManageCallCenterDialogData, ManageCallCenterDismissed } from "../models/manage-call-center.model";
import { CallCenterConfigs } from "../models/call-center-configs.model";
import { Permission } from "@empowered/constants";
import {
    EnrollmentOptionsState,
    SetAccountCallCenters,
    SetOfferingPlanChoices,
    SetPINSignatureExceptions,
    SetAllowedExceptionTypes,
    ExceptionBusinessService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { AccountListState, AccountInfoState, SharedState, RegexDataType } from "@empowered/ngxs-store";
import { AgRefreshService, MembersBusinessService } from "@empowered/ui";

const callCenterId = "callCenterId";
const ADD_SUCCESS = "addSuccess";
const SAME_CALL_CENTER_OVERLAP = "sameCallCenterOverlap";
const SAME_CALL_CENTER_ADJACENT = "sameCallCenterAdjacent";
const UPDATE_SUCCESS = "updateSuccess";

// This is to help sort producers in the order
// primary producer < writing producer < enroller ...
const PRODUCER_ROLE_ORDER = {
    PRIMARY_PRODUCER: 1,
    WRITING_PRODUCER: 2,
    ENROLLER: 3,
    HQ_EXCHANGE_TEAM_SUPPORT: 4,
    MANAGING_PRODUCER: 5,
};

interface CallCenter8x8Restrictions {
    planChoices?: PlanChoice[];
    pinSignatureExceptions?: Exceptions[];
    callCenterDisabilityEnrollmentRestricted: boolean;
}

@Component({
    selector: "empowered-call-center",
    templateUrl: "./call-center.component.html",
    styleUrls: ["./call-center.component.scss"],
})
export class CallCenterComponent implements OnInit, OnDestroy, AfterViewInit {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    // eslint-disable-next-line @angular-eslint/no-output-on-prefix
    @Output() onError: EventEmitter<HttpErrorResponse> = new EventEmitter<HttpErrorResponse>();

    mpGroup: number;
    benefitsOfferingSet: boolean;
    accountCallCenters: AccountCallCenter[];
    validationRegex: RegexDataType;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.callCenter.addcallcenter",
        "primary.portal.callCenter.callcenterenrollment",
        "primary.portal.callCenter.addfirstCallcenter",
        "primary.portal.callCenter.benefitsOffering",
        "primary.portal.callCenter.thisAccount",
        "primary.portal.callCenter.associatedCallcenters",
    ]);
    isAdmin = false;
    pinForm: FormGroup;
    subscriptions: Subscription[] = [];
    callCenters: CallCenter[] = [];
    currentAccount: AccountDetails;
    numberOfMembers: number;
    accountMeetsMinEmployeeCriteria: boolean;
    planChoices: PlanChoice[];
    producers: PageableResponse<ProducerListItem>;
    isLoading: boolean;
    isCreateCallCenter = false;
    callCenterDisabilityEnrollmentRestricted: boolean;
    callCenter8x8Configs$: Observable<CallCenterConfigs>;
    isRole20User = false;

    constructor(
        private readonly benefitsOffering: BenefitsOfferingService,
        private readonly account: AccountService,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly route: ActivatedRoute,
        private readonly formBuilder: FormBuilder,
        private readonly utilService: UtilService,
        private readonly staticService: StaticService,
        private readonly bottomSheet: EmpoweredSheetService,
        private readonly producer: ProducerService,
        private readonly staticUtil: StaticUtilService,
        private readonly agRefreshService: AgRefreshService,
        private readonly membersBusinessService: MembersBusinessService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
    ) {}

    /**
     * Angular life cycle hook
     * Initialize pin form, get portal, mpGroup and account info from store
     * get call centers and filter based on account type
     */
    ngOnInit(): void {
        if (this.store.selectSnapshot(SharedState.portal) === Portals.ADMIN) {
            this.isAdmin = true;
        }
        this.mpGroup = this.store.selectSnapshot(AccountListState.getGroup).id;
        this.callCenter8x8Configs$ = this.get8x8CallCenterConfigs().pipe(shareReplay(1));
        this.subscriptions.push(
            this.regex$.pipe(filter<RegexDataType>(Boolean)).subscribe((data) => (this.validationRegex = data)),
            this.store
                .select(SharedState.hasPermission(Permission.ACCOUNT_CREATE_CALL_CENTER))
                .subscribe((hasPermission) => (this.isCreateCallCenter = hasPermission)),
            this.agRefreshService.refreshAccount$.pipe(tap(() => this.getAccountCallCenters(this.mpGroup, callCenterId))).subscribe(),
            this.getRestrictions().subscribe(),
            this.store
                .select(EnrollmentOptionsState.getAccountCallCenters)
                .subscribe((accountCallCenters) => (this.accountCallCenters = accountCallCenters)),
            this.store.select(SharedState.hasPermission(Permission.MANAGE_AGENT_ASSISTED)).subscribe((res) => (this.isRole20User = res)),
        );
        this.pinForm = this.formBuilder.group(
            {
                pinControl: [
                    "",
                    [Validators.required, Validators.maxLength(25), Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE)],
                ],
            },
            { updateOn: "blur" },
        );
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
    }

    /**
     * Get call center restrictions.
     *
     * @returns data needed to determine restrictions to add a new call center
     */
    getRestrictions(): Observable<
        | [
              [CallCenter[], PlanChoice[], Exceptions[], PageableResponse<ProducerListItem>, AccountCallCenter[]],
              CallCenterConfigs,
              AccountList,
          ]
        | CallCenter8x8Restrictions
    > {
        this.isLoading = true;
        return forkJoin([
            this.staticService.getCallCenters(),
            this.producer.producerSearch({ filter: `accountId:${this.mpGroup}` }),
            this.checkBenOfferingSet(),
            this.membersBusinessService.getActiveMembers(this.mpGroup),
        ]).pipe(
            withLatestFrom(this.callCenter8x8Configs$),
            map(([[callCenters, producers, , members], configs]) => ({
                callCenters: callCenters.filter(
                    (callCenter) =>
                        // Call center is not direct-only, meets min subscriber criteria (if 8x8 is enabled)
                        // and if import type is AG, AG enrollment is allowed
                        !callCenter.directOnly &&
                        (this.currentAccount.importType !== AccountImportTypes.AFLAC_GROUP || callCenter.aflacGroupEnrollmentAllowed),
                ),
                producers,
                numberOfMembers: members.length,
                configs,
            })),
            tap(({ callCenters, producers, numberOfMembers, configs }) => {
                this.callCenters = callCenters;
                this.numberOfMembers = numberOfMembers;
                this.producers = producers;
                this.accountMeetsMinEmployeeCriteria =
                    !configs.featureEnabled || this.numberOfMembers >= +configs.callCenterEnrollmentMinEmployees;
                this.isLoading = false;
            }),
            switchMap(({ numberOfMembers }) =>
                this.exceptionBusinessService.callCenter8x8DisabilityRestricted(
                    this.mpGroup,
                    ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ENABLED,
                    ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_MIN_EMPLOYEES,
                    ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ALLOWED,
                    this.staticUtil,
                    numberOfMembers,
                ),
            ),
            tap(({ planChoices, callCenterDisabilityEnrollmentRestricted: callCenterDisabilityEnrollmentRestricted }) => {
                this.planChoices = planChoices;
                this.callCenterDisabilityEnrollmentRestricted = callCenterDisabilityEnrollmentRestricted;
                this.store.dispatch(new SetOfferingPlanChoices(this.planChoices));
            }),
            catchError((error) => {
                this.isLoading = false;
                this.showErrorAlertMessage(error);
                return of(null);
            }),
        );
    }

    /**
     * method to check benefits offering approval request and call center
     * @returns observable of account call centers
     */
    checkBenOfferingSet(): Observable<boolean> {
        return this.benefitsOffering.getApprovalRequests(this.mpGroup).pipe(
            map((approvalRequests) => approvalRequests && approvalRequests.length > 0 && this.mpGroup > 0),
            tap((benefitsOfferingSet) => {
                this.benefitsOfferingSet = benefitsOfferingSet;
                if (!benefitsOfferingSet) {
                    this.isLoading = false;
                }
            }),
        );
    }

    /**
     * life-cycle hook to execute logic if the page is from refresh account info.
     * @returns void
     */
    ngAfterViewInit(): void {
        this.subscriptions.push(
            this.utilService
                .getRefreshActivity()
                .pipe(
                    filter((isRefresh) => isRefresh),
                    tap(() => {
                        this.getAccountCallCenters(this.mpGroup, callCenterId);
                        this.utilService.setRefreshActivity(false);
                    }),
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        return of([]);
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Method to navigate to Benefit-Offering page
     */
    navigateToBenefitsOffering(): void {
        if (
            this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP ||
            this.currentAccount.importType === AccountImportTypes.SHARED_CASE
        ) {
            this.router.navigate(["../../dashboard/benefits/aflac-group-offering"], { relativeTo: this.route });
        } else {
            this.router.navigate(["../../dashboard/benefits/offering"], { relativeTo: this.route });
        }
    }
    /**
     * Method to open manage call center popup
     * @param isAdd boolean flag to determine add or edit call center
     * @param callCenter AccountCallCenter call center linked to account
     */
    openManageCallCenterDialog(isAdd: boolean, callCenter?: AccountCallCenter): void {
        this.subscriptions.push(
            this.callCenter8x8Configs$
                .pipe(
                    switchMap((configs) =>
                        this.bottomSheet
                            .openSheet(ManageCallCenterDialogComponent, {
                                data: this.getManageCallCenterData(isAdd, callCenter, this.producers, configs),
                            })
                            .afterDismissed(),
                    ),
                    filter<ManageCallCenterDismissed>(Boolean),
                    map((data) => ({
                        ...data,
                        isNewTFN: data.currentAccountCallCenter && data.currentAccountCallCenter.scheduleType,
                    })),
                    tap((data) => {
                        if (
                            // show submit confirmation if:
                            // call center (non-8x8) was newly added
                            (!data.is8x8CallCenterSelected && data.action === ADD_SUCCESS) ||
                            // or if an 8x8 call center was added / updated only with the 'create new TFN' option
                            // or if an 8x8 call center was updated using an existing TFN
                            (data.is8x8CallCenterSelected &&
                                (data.action === UPDATE_SUCCESS || (data.action === ADD_SUCCESS && data.isNewTFN)))
                        ) {
                            this.openApprovalDialog(data);
                        } else if (data.action === SAME_CALL_CENTER_OVERLAP) {
                            this.openSameCallCenterOverlapDialog(data.currentAccountCallCenter);
                        } else if (data.action === SAME_CALL_CENTER_ADJACENT) {
                            this.openSameCallCenterAdjacentDialog(data.currentAccountCallCenter);
                        }
                    }),
                    filter(
                        (afterClosed) =>
                            afterClosed.action === UPDATE_SUCCESS ||
                            (afterClosed.is8x8CallCenterSelected && afterClosed.action === ADD_SUCCESS && !afterClosed.isNewTFN),
                    ),
                    tap(() => this.getAccountCallCenters(this.mpGroup, callCenterId)),
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        return of([]);
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Returns data to be passed to the add / edit call center modal.
     *
     * @param isAdd true while adding call center, false while editing
     * @param callCenter call center to be edited
     * @param producers list of producers of the account
     * @param configs configs related tp 8x8 call centers
     * @returns data to be passed to the modal
     */
    getManageCallCenterData(
        isAdd: boolean,
        callCenter: AccountCallCenter,
        producers: PageableResponse<ProducerListItem>,
        configs: CallCenterConfigs,
    ): ManageCallCenterDialogData {
        return {
            isAdd,
            callCenter: isAdd ? null : callCenter,
            accountCallCenters: this.accountCallCenters,
            callCentersList:
                isAdd && configs.featureEnabled
                    ? this.callCenters.filter((possibleCallCenter) => this.numberOfMembers >= possibleCallCenter.minSubscriberCount)
                    : this.callCenters,
            numberOfMembers: this.numberOfMembers,
            planChoices: this.planChoices,
            pinSignatureExceptions: this.store.selectSnapshot(EnrollmentOptionsState.getPINSignatureExceptions),
            producers: {
                ...producers,
                content: this.sortProducers(producers.content.filter((producer) => !(producer.pendingInvite || producer.declinedInvite))),
            },
            configs,
            callCenterDisabilityEnrollmentRestricted: this.callCenterDisabilityEnrollmentRestricted,
        };
    }

    /**
     * Sorts a list of producers in the order defined by PRODUCER_ROLE_ORDER.
     *
     * @param producers input array of producers
     * @returns sorted array of producers
     */
    sortProducers(producers: ProducerListItem[]): ProducerListItem[] {
        return [...producers].sort((first, second) => PRODUCER_ROLE_ORDER[first.role] - PRODUCER_ROLE_ORDER[second.role]);
    }

    onCallCenterEdit(currentAccountCallCenter: AccountCallCenter): void {
        this.openManageCallCenterDialog(false, currentAccountCallCenter);
    }

    /**
     *  method to open approval dialog
     * @param data data to be passed to the approval confirmation modal
     * @returns void
     */
    openApprovalDialog(data: ManageCallCenterDismissed): void {
        // If user is role 20 and adding BB call center don't open the approve dialog
        if (this.isRole20User && data?.callCenterName === "Building Blocks") {
            this.getAccountCallCenters(this.mpGroup, callCenterId);
        } else {
            const approvalDialogRef = this.dialog.open(ApprovalDialogComponent, {
                width: "750px",
                data: { purpose: "approve", ...data },
            });
            this.subscriptions.push(
                approvalDialogRef
                    .afterClosed()
                    .pipe(
                        filter((afterClosed) => afterClosed.action === "closeApprove"),
                        tap(() => this.getAccountCallCenters(this.mpGroup, callCenterId)),
                        catchError((error) => {
                            this.showErrorAlertMessage(error);
                            return of([]);
                        }),
                    )
                    .subscribe(),
            );
        }
    }
    onCallCenterRemove(currentAccountCallCenter: AccountCallCenter): void {
        this.openRemoveCallCenterDialog(currentAccountCallCenter);
    }
    openRemoveCallCenterDialog(currentAccountCallCenter: AccountCallCenter): void {
        const removeDialogRef = this.dialog.open(ApprovalDialogComponent, {
            width: "750px",
            data: { purpose: "remove", callCenterName: currentAccountCallCenter.callCenter.name },
            autoFocus: true,
            disableClose: false,
        });
        removeDialogRef.afterClosed().subscribe((res) => {
            if (res.action === "closeRemove") {
                this.removeCallCenter(currentAccountCallCenter);
            }
        });
    }
    /**
     * method to remove call center
     * @param currentAccountCallCenter passing current call center
     * @returns void
     */
    removeCallCenter(currentAccountCallCenter: AccountCallCenter): void {
        this.subscriptions.push(
            this.account
                .deleteAccountCallCenter(currentAccountCallCenter.id, this.mpGroup)
                .pipe(
                    tap(() => this.getAccountCallCenters(this.mpGroup, callCenterId)),
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        return of([]);
                    }),
                )
                .subscribe(),
        );
    }
    openSameCallCenterOverlapDialog(currentAccountCallCenter: AccountCallCenter): void {
        const sameCallCenterOverlapDialogRef = this.dialog.open(ApprovalDialogComponent, {
            width: "750px",
            data: { purpose: "sameCallCenterOverlap", currentAccountCallCenter: currentAccountCallCenter },
        });
        sameCallCenterOverlapDialogRef.afterClosed().subscribe((res) => {
            if (res.action === "closeSameCallCenterOverlap") {
                this.openManageCallCenterDialog(false, currentAccountCallCenter);
            }
        });
    }
    openSameCallCenterAdjacentDialog(currentAccountCallCenter: AccountCallCenter): void {
        const sameCallCenterAdjacentDialogRef = this.dialog.open(ApprovalDialogComponent, {
            width: "750px",
            data: { purpose: "sameCallCenterAdjacent", callCenterName: currentAccountCallCenter.callCenter.name },
        });
        sameCallCenterAdjacentDialogRef.afterClosed().subscribe((res) => {
            if (res.action === "closeSameCallCenterAdjacent") {
                this.openManageCallCenterDialog(false, currentAccountCallCenter);
            }
        });
    }

    /**
     * Delivers error events to the parent component where the error message is shown.
     *
     * @param error http error response
     */
    showErrorAlertMessage(error: HttpErrorResponse): void {
        this.onError.emit(error);
    }

    /**
     * Fetch configs for the 8x8 VCC call center.
     *
     * @returns configs
     */
    get8x8CallCenterConfigs(): Observable<CallCenterConfigs> {
        return combineLatest(
            this.staticUtil.cacheConfigEnabled(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ENABLED),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ALLOWED),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_CUSTOM_RECORDING_MAX_CHARACTERS),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_INBOUND_MIN_ELIGIBLE_EMPLOYEES),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_START_TIME_DEFAULT),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_END_TIME_DEFAULT),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_MIN_EMPLOYEES),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_MIN_EMPLOYEES),
            this.staticUtil.cacheConfigValue(ConfigName.MAX_LOCATION_LENGTH),
            this.staticUtil.cacheConfigValue(ConfigName.MIN_LOCATION_LENGTH),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_SUPPORT_EMAIL),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_SUPPORT_EMAIL),
            this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_START_DATE_FROM_MIN_DAYS),
        ).pipe(
            map(
                ([
                    featureEnabled,
                    allowedCallCenterIds,
                    customRecordingMaxCharacters,
                    inboundCallCenterMinEligibleEmployees,
                    startTimeDefault,
                    endTimeDefault,
                    callCenterEnrollmentMinEmployees,
                    disabilityEnrollmentMinEmployees,
                    accountNameMaxLength,
                    accountNameMinLength,
                    enrollmentSupportEmail,
                    disabilityEnrollmentSupportEmail,
                    callCenterStartDateFromMinDays,
                ]) => ({
                    featureEnabled,
                    allowedCallCenterIds: featureEnabled ? allowedCallCenterIds && allowedCallCenterIds.split(",").map((id) => +id) : [],
                    customRecordingMaxCharacters: +customRecordingMaxCharacters,
                    inboundCallCenterMinEligibleEmployees: +inboundCallCenterMinEligibleEmployees,
                    startTimeDefault,
                    endTimeDefault,
                    callCenterEnrollmentMinEmployees: +callCenterEnrollmentMinEmployees,
                    disabilityEnrollmentMinEmployees: +disabilityEnrollmentMinEmployees,
                    accountNameMaxLength: +accountNameMaxLength,
                    accountNameMinLength: +accountNameMinLength,
                    enrollmentSupportEmail,
                    disabilityEnrollmentSupportEmail,
                    callCenterStartDateFromMinDays: +callCenterStartDateFromMinDays,
                }),
            ),
        );
    }

    /**
     * Fetches call centers for an account.
     *
     * @param mpGroup group's id
     * @param expand if defined, is "callCenterId", to get call center details
     */
    getAccountCallCenters(mpGroup: number, expand: "callCenterId"): void {
        this.store.dispatch(new SetAccountCallCenters(mpGroup, expand));
        this.store.dispatch(new SetAllowedExceptionTypes());
        this.store.dispatch(new SetPINSignatureExceptions(mpGroup));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
