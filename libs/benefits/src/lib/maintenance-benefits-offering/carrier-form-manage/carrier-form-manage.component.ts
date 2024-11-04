/* eslint-disable no-underscore-dangle */
import { ViewFormManageComponent } from "./view-form-manage/view-form-manage.component";
import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { BenefitsOfferingState, GetCarrierSetupStatuses, SetCarrierForms } from "@empowered/ngxs-store";
import { Observable, Subject } from "rxjs";
import { CarrierFormWithCarrierInfo, ApprovalItemObject, AccountCarrier } from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { take, map, takeUntil, mergeMap, tap, switchMap } from "rxjs/operators";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { ActivatedRoute } from "@angular/router";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { EmpoweredModalService } from "@empowered/common-services";
import { CarrierFormSetupStatus, CarrierSetupStatus, BenefitsOfferingService, CarrierSetupStatusExtended } from "@empowered/api";
import { ProductsPlansQuasiService } from "../products-plans-quasi";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { DateFormats, AppSettings, StatusType } from "@empowered/constants";

enum SubmittedToType {
    CARRIER = "carrier",
    ACCOUNT = "account",
}
@Component({
    selector: "empowered-carrier-form-manage",
    templateUrl: "./carrier-form-manage.component.html",
    styleUrls: ["./carrier-form-manage.component.scss"],
})
export class CarrierFormManageComponent implements OnInit, OnDestroy {
    @Select(BenefitsOfferingState.getAllCarrierForms) forms$: Observable<CarrierFormWithCarrierInfo[]>;
    @Select(BenefitsOfferingState.getCarrierSetupStatuses) statuses$: Observable<CarrierSetupStatus[]>;
    @Output() emitUnApprovedCarriers = new EventEmitter<any>();
    inCompleteForms$: Observable<CarrierFormWithCarrierInfo[]>;
    completeForms$: Observable<CarrierFormWithCarrierInfo[]>;
    private unsubscribe$: Subject<void> = new Subject<void>();
    carriersDisplayedColumns: string[] = ["carrier", "formName", "dateCompleted", "accountApproval", "carrierApproval", "manage"];
    statuses: CarrierSetupStatus[];
    submittedStatuses = [StatusType.SUBMITTED_TO_HQ, StatusType.SUBMITTED_TO_HR];
    approvalRequestStatusArray = [];
    approvalStatusPending: boolean;
    FormStatusEnum = CarrierFormSetupStatus;
    languageBasePath = "primary.portal.maintenanceBenefitsOffering.carrierFromManage";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        // Component-specific strings
        ...[
            "inProgress",
            "carrier",
            "formName",
            "dateCompleted",
            "accountApproval",
            "carrierApproval",
            "pending",
            "manage",
            "start",
            "resume",
            "viewEdit",
            "completed",
            "autoApproved",
        ].map((str) => `${this.languageBasePath}.${str}`),
        // Others
        ...["primary.portal.resources.carrier", "primary.portal.pendedBusiness.account", "primary.portal.qle.viewLabel"],
    ]);
    statusesForTooltip = [CarrierFormSetupStatus.APPROVED, CarrierFormSetupStatus.CANCELED, CarrierFormSetupStatus.DENIED];
    mpGroup: any;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    isAdmin: boolean;
    isLoading: boolean;

    constructor(
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly route: ActivatedRoute,
        private readonly datePipe: DatePipe,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
    ) {}
    /**
     * Angular lifecycle method to initialize component
     * get benefitOfferingCarriers data and update the store
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.isAdmin = this.quasiService.isAdminLoggedIn();
        this.mpGroup = this.route.parent.snapshot.parent.parent.params.mpGroupId;
        this.getApprovalRequests();
        const approvedCarriers: AccountCarrier[] = [];
        this.benefitOfferingService
            .getBenefitOfferingCarriers(false)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((res) => {
                    approvedCarriers.push(...res);
                }),
                switchMap((res) => this.benefitOfferingService.getBenefitOfferingCarriers(true).pipe(takeUntil(this.unsubscribe$))),
                map((unApprovedCarriers) => {
                    const carrierIds: number[] = [];
                    carrierIds.push(...unApprovedCarriers.map((carrier) => carrier.id));
                    carrierIds.push(...approvedCarriers.map((carrier) => carrier.id));
                    return carrierIds;
                }),
                mergeMap((resp) => this.store.dispatch(new GetCarrierSetupStatuses(resp, false))),
                mergeMap((resp) => this.store.dispatch(new SetCarrierForms(false, false))),
                mergeMap((resp) => this.store.dispatch(new SetCarrierForms(true, false))),
                mergeMap((resp) => this.statuses$.pipe(takeUntil(this.unsubscribe$))),
            )
            .subscribe((resp) => {
                this.statuses = resp;
                this.isLoading = false;
                this.inCompleteForms$ = this.transformForms(
                    this.forms$.pipe(
                        map((forms) =>
                            forms.filter((form) => !this.statusesForTooltip.includes(form.formStatus as CarrierFormSetupStatus)),
                        ),
                    ),
                );
                this.completeForms$ = this.transformForms(
                    this.forms$.pipe(
                        map((forms) => forms.filter((form) => this.statusesForTooltip.includes(form.formStatus as CarrierFormSetupStatus))),
                    ),
                );
            });
    }

    /**
     * Opens the pdf of the form
     * @param form carrier form that is being viewed
     */
    openViewPDFModal(form: CarrierFormWithCarrierInfo): void {
        const isMaintenance = true;
        const dialogRef: MatDialogRef<ViewFormManageComponent> = this.empoweredModalService.openDialog(ViewFormManageComponent, {
            data: { form: form, mpGroup: this.mpGroup },
        });
        dialogRef.afterClosed().pipe(take(1)).subscribe();
    }
    /**
     * This method is used to set carrier form alert status
     */
    setCarrierStatus(): void {
        if (
            this.approvalRequestStatusArray.length &&
            this.submittedStatuses.includes(this.approvalRequestStatusArray.slice().pop().status)
        ) {
            this.approvalStatusPending = true;
            const plansCount: number = this.benefitOfferingHelperService.getPlansCountToDisplayInPendingAlert(
                this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1],
            );
            this.emitUnApprovedCarriers.emit({
                status: this.approvalRequestStatusArray[this.approvalRequestStatusArray.length - 1].status,
                plans: plansCount,
            });
        }
    }

    getTooltipTemplate(formId: number, type: SubmittedToType, statusObj: CarrierSetupStatusExtended): string | undefined {
        let submittedTo, status;
        switch (type) {
            case SubmittedToType.ACCOUNT:
                submittedTo = this.languageStrings["primary.portal.pendedBusiness.account"];
                status = statusObj._accountApprovalStatus;
                break;
            case SubmittedToType.CARRIER:
                submittedTo = this.languageStrings["primary.portal.resources.carrier"];
                status = statusObj._carrierApprovalStatus;
                break;
        }
        if (!formId) {
            status = this.languageStrings[`${this.languageBasePath}.autoApproved`];
        }
        status = this.titleCasePipe.transform(status);
        if (statusObj) {
            const carrierSubmissionDate = statusObj._carrierSubmissionDate
                ? this.datePipe.transform(statusObj._carrierSubmissionDate, DateFormats.MONTH_DAY_YEAR)
                : "";
            const carrierApprovalDate = statusObj._carrierApprovalDate
                ? this.datePipe.transform(statusObj._carrierApprovalDate, DateFormats.MONTH_DAY_YEAR)
                : "";
            return `<table>
                      <tbody>
                          <tr>
                            <td><b>Submitted to ${submittedTo.toLowerCase()}</b></td>
                            <td><b>${status}</b></td>
                          </tr>
                          <tr>
                              <td>${
    type === SubmittedToType.ACCOUNT
        ? this.datePipe.transform(statusObj._accountSubmissionDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)
        : carrierSubmissionDate
}</td>
                              <td>${
    type === SubmittedToType.ACCOUNT
        ? this.datePipe.transform(statusObj._accountApprovalDate, AppSettings.DATE_FORMAT_MM_DD_YYYY)
        : carrierApprovalDate
}</td>
                          </tr>
                      </tbody>
                  </table>`;
        }
        return undefined;
    }
    transformForms(forms$: Observable<CarrierFormWithCarrierInfo[]>): Observable<CarrierFormWithCarrierInfo[]> {
        return forms$.pipe(
            map((forms) =>
                // eslint-disable-next-line complexity
                forms.map((form) => {
                    const status = form.status || this.statuses.find((statusObj) => statusObj.carrierId === form.carrierId);
                    let _accountApprovalStatus,
                        _carrierApprovalStatus,
                        _dateCompleted,
                        _accountSubmissionDate,
                        _accountApprovalDate,
                        _carrierSubmissionDate,
                        _carrierApprovalDate;
                    const statusTitleCase = status ? status.status.toString() : "";
                    _carrierApprovalStatus = "";
                    if (status) {
                        switch (status.status) {
                            // Account approval status is incomplete. Date completed is initialCompletionDate. Carrier approval is NA.
                            case CarrierFormSetupStatus.INCOMPLETE:
                                _accountApprovalStatus = statusTitleCase;
                                _dateCompleted = status.initialCompletionDate;
                                break;
                            case CarrierFormSetupStatus.SIGNED_BY_BROKER:
                            case CarrierFormSetupStatus.SUBMITTED_TO_CARRIER:
                            case CarrierFormSetupStatus.SIGNED_BY_GROUP:
                                if (!status.accountApprovalDate && !status.carrierSubmissionDate) {
                                    // Account approval is pending. Carrier approval is NA.
                                    _accountApprovalStatus = CarrierFormSetupStatus.PENDING;
                                    _dateCompleted = status.initialCompletionDate;
                                } else if (status.accountApprovalDate) {
                                    // Approved by account. Carrier approval is pending.
                                    _accountApprovalStatus = CarrierFormSetupStatus.APPROVED;
                                    _carrierApprovalStatus = CarrierFormSetupStatus.PENDING;
                                    _dateCompleted = status.accountApprovalDate;
                                    _accountSubmissionDate = _accountApprovalDate = status.accountApprovalDate;
                                }
                                break;
                            case CarrierFormSetupStatus.APPROVED_AUTO:
                            case CarrierFormSetupStatus.APPROVED_BY_CARRIER:
                                _accountApprovalStatus = statusTitleCase;
                                if (status.accountApprovalDate && !status.carrierSubmissionDate) {
                                    // Approved by account. Carrier approval is NA.
                                    _dateCompleted = status.accountApprovalDate;
                                    _accountSubmissionDate = _accountApprovalDate = status.accountApprovalDate;
                                } else if (status.carrierResponseDate) {
                                    // Approved by account. Approved by carrier.
                                    _carrierApprovalStatus = CarrierFormSetupStatus.APPROVED;
                                    _dateCompleted = status.carrierResponseDate;
                                    _accountSubmissionDate = _accountApprovalDate = status.carrierResponseDate;
                                    _carrierSubmissionDate = _carrierApprovalDate = status.carrierResponseDate;
                                }
                                break;
                            case CarrierFormSetupStatus.DENIED_BY_CARRIER:
                            case CarrierFormSetupStatus.CANCELED:
                            case CarrierFormSetupStatus.CANCELLED_MIN_PARTICIPATION:
                                if (status.accountApprovalDate) {
                                    if (!status.carrierResponseDate) {
                                        _dateCompleted = status.accountApprovalDate;
                                        _accountSubmissionDate = _accountApprovalDate = status.accountApprovalDate;
                                    } else {
                                        _carrierApprovalStatus = CarrierFormSetupStatus.DENIED;
                                        _dateCompleted = status.carrierResponseDate;
                                        _accountSubmissionDate = _accountApprovalDate = status.accountApprovalDate;
                                        _carrierSubmissionDate = _carrierApprovalDate = status.carrierResponseDate;
                                    }
                                }
                                break;
                        }
                    }

                    return Object.assign({}, form, {
                        status: Object.assign({}, status, {
                            _accountApprovalStatus,
                            _carrierApprovalStatus,
                            _dateCompleted,
                            _accountSubmissionDate,
                            _accountApprovalDate,
                            _carrierSubmissionDate,
                            _carrierApprovalDate,
                        }),
                    });
                }),
            ),
        );
    }
    isFormPendingApproval(form: CarrierFormWithCarrierInfo): boolean {
        return Array.prototype.concat
            .apply(
                [],
                this.approvalRequestStatusArray
                    .filter((approvalRequest) => this.submittedStatuses.includes(approvalRequest.status))
                    .map((approvalRequestStatus) =>
                        approvalRequestStatus.approvalItems.filter(
                            (approvalItem) => approvalItem.object === ApprovalItemObject.CARRIER_FORMS,
                        ),
                    ),
            )
            .find((item) => item.objectName === form.carrierName);
    }
    /**
     * This method is used to fetch Approval requests and set carrier-form tab alert
     */
    getApprovalRequests(): void {
        this.benefitOfferingService
            .getApprovalRequests(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.approvalRequestStatusArray = [...res];
                this.setCarrierStatus();
            });
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
    }
}
