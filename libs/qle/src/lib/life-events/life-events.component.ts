import { UserService } from "@empowered/user";
import { Router, ActivatedRoute } from "@angular/router";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MemberService, QLEEndPlanRequestStatus, MemberQLETypes, StaticService, EmploymentStatus } from "@empowered/api";
import { Store } from "@ngxs/store";
import { AddNewQleComponent } from "../add-new-qle/add-new-qle.component";
import { PendingEnrollmentComponent } from "../pending-enrollment/pending-enrollment.component";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ApproveDenialQleComponent } from "../approve-denial-qle/approve-denial-qle.component";
import { DatePipe } from "@angular/common";
import {
    GetQualifyingEventType,
    AccountListState,
    EnrollmentMethodState,
    EnrollmentMethodStateModel,
    SharedState,
    SetIdToCloseSEP,
    UtilService,
    DualPlanYearService,
} from "@empowered/ngxs-store";
import { Observable, Subscription, of, Subject } from "rxjs";
import { Enrollment, AuthenticationService, PermissionsModel, BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { ApproveDenyEndCoverageComponent } from "../approve-deny-end-coverage/approve-deny-end-coverage.component";
import { map, takeUntil } from "rxjs/operators";
import {
    Permission,
    DateFormats,
    BooleanConst,
    AppSettings,
    MemberCredential,
    StatusType,
    QualifyingEventType,
    MemberQualifyingEvent,
    MemberQualifyingEventApprove,
} from "@empowered/constants";
import { AccountsBusinessService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { EnrollmentMethodComponent } from "@empowered/ui";

const ONE_DAY = 1;
const DAY = "day";
const SHOP_ROUTE = "member/wizard/enrollment/shop";
const LIFE_EVENT = "lifeEvent";
const HQ_ACCOUNT = "is_hq_account";
const TRUE_VALUE = "TRUE";

@Component({
    selector: "empowered-life-events",
    templateUrl: "./life-events.component.html",
    styleUrls: ["./life-events.component.scss"],
})
export class LifeEventsComponent implements OnInit, OnDestroy {
    mpGroupId: number;
    MemberInfo: any;
    displayedColumns: string[] = ["type", "eventDate", "qleAdded", "documents", "status", "manage"];
    dataSource: any;
    memberId: number;
    MpGroup: number;
    isPending = false;
    benefitsOffered = true;
    enrollmentState: EnrollmentMethodStateModel;
    qleList: MemberQualifyingEvent[] = [];
    eventTypes$: Observable<QualifyingEventType>;
    eventTypes: QualifyingEventType[] = [];
    pending = StatusType.PENDING;
    isInprogress = StatusType.INPROGRESS;
    isApproved = StatusType.APPROVED;
    isDeclined = StatusType.DENIED;
    days: any;
    state: any;
    mpGroup: any;
    now = new Date();
    isLoading = true;
    selecteEvent: QualifyingEventType;
    isLifeEvents = false;
    isStatusViewDetails = false;
    isStatusInprogress = false;
    NEW_HIRE = MemberQLETypes.NEW_HIRE;
    isStatusViewPendingEnrollments = false;
    isStatusViewPendingCoverage = false;
    modalRes: any;
    enrollmentId: Enrollment[] = [];
    eventExpireDate = new Date();
    length: number;
    changedQLE: MemberQualifyingEvent = {} as any;
    errorResponse: boolean;
    errorMessage = "";
    portal = "";
    isMember = false;
    isAdmin = false;
    firstName: string;
    private readonly unsubscribe$ = new Subject<void>();
    subscriptions: Subscription[] = [];
    currentDate = new Date().setHours(0, 0, 0, 0);
    private readonly LANGUAGE_PENDING_COVERAGE = "primary.portal.qle.endCoverageRequest";
    showShopButton = true;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.qle.addLifeEvent",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.qle.editLifeEvent",
        "primary.portal.members.membersList.shop",
        "primary.portal.qle.closeEnrollmentPeriod",
        "primary.portal.qle.lifeEvents",
        "primary.portal.qle.member.noLifeEvent",
        "primary.portal.qle.viewDetails",
        "primary.portal.qle.viewPendingEnrollments",
        "primary.portal.qle.viewPendingCoverage",
        this.LANGUAGE_PENDING_COVERAGE,
    ]);

    qleData: any[] = [];
    p: boolean;
    addNewQleDialogRef: MatDialogRef<AddNewQleComponent>;
    approveDenialQleDialogRef: MatDialogRef<ApproveDenialQleComponent>;
    pendingEnrollmentDialogRef: MatDialogRef<PendingEnrollmentComponent>;
    BY_REQUEST_QLE = 74;
    ALLOWED_FILE_TYPE_CONFIG = "qle.upload.allowed_file_types";
    acceptableFormats: string;
    hasPrivilege$ = of(false);
    terminationDate: string;
    showShopMenu = true;
    isShopEnabled = true;
    isTpiAccount = false;
    isHqAccount = false;
    showShopConfig = true;
    shopPermission = false;

    constructor(
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly authService: AuthenticationService,
        private readonly utilService: UtilService,
        private readonly user: UserService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticService: StaticService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly accountBusinessService: AccountsBusinessService,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Method to navigate to shop page
     * @param qleId QLE id
     * @returns void
     */
    openShop(qleId: number): void {
        this.dualPlanYearService.genericShopOeQLeNavigate(this.MemberInfo.id, this.mpGroupId);
        this.store.dispatch(new SetIdToCloseSEP(qleId));
        this.router.navigate([SHOP_ROUTE]);
    }

    openQleDialog(): void {
        this.addNewQleDialogRef = this.dialog.open(AddNewQleComponent, {
            width: "600px",
            panelClass: "add-qle",
        });

        // this.addNewQleDialogRef.afterClosed(); // This needs to be confirmed
        this.utilService.bindDialogOpenAndClose(this.addNewQleDialogRef);
    }

    openApproveDenialEnrollmentDialog(element: any, event: any): void {
        this.eventTypes.forEach((ele) => {
            if (ele.description === element.type) {
                this.selecteEvent = ele;
            }
        });
        this.approveDenialQleDialogRef = this.dialog.open(ApproveDenialQleComponent, {
            maxWidth: "600px",
            panelClass: "approve-denial-qle",
            data: {
                selectedVal: this.qleEventData(element),
                selecteEvent: this.selecteEvent,
                enrollmentId: element.enrollmentId,
            },
        });

        // this.approveDenialQleDialogRef.afterClosed(); // This needs to be confirmed
        this.utilService.bindDialogOpenAndClose(this.approveDenialQleDialogRef);
    }

    /**
     * method to open Review End Coverage popup
     * @param element: MemberQualifyingEventApprove, the element to be passed to the next screen
     * @returns void
     */
    openApproveDenyEndCoverage(element: MemberQualifyingEventApprove): void {
        const typeId = this.BY_REQUEST_QLE;
        this.empoweredModalService.openDialog(ApproveDenyEndCoverageComponent, {
            data: {
                selectedVal: this.qleEventData(element, typeId),
            },
        });
    }

    /**
     * Get the values of selected QLE
     * @param value: MemberQualifyingEventApprove, the qualifying event
     * @param typeId: number, id of type of qle
     * @returns MemberQualifyingEventApprove
     */
    qleEventData(value: MemberQualifyingEventApprove, typeId?: number): MemberQualifyingEventApprove {
        const res = this.qleData.filter((qle) => qle.id === value.id);
        const specificEvent: MemberQualifyingEventApprove = {
            adminComment: value.adminComment,
            memberComment: value.memberComment,
            coverageStartDates: value.coverageStartDates,
            createDate: res[0].createDate,
            daysToReport: value.daysToReport,
            documents: value.documents,
            enrollmentId: value.enrollmentId,
            enrollmentValidity: value.enrollmentValidity,
            eventDate: res[0].eventDate,
            id: value.id,
            isApprovedEnrollment: value.isApprovedEnrollment,
            isNoEnrollment: value.isNoEnrollment,
            isPending: value.isPending,
            isStatusInprogress: value.isStatusInprogress,
            isStatusViewDetails: value.isStatusViewDetails,
            isStatusViewPendingEnrollments: value.isStatusViewPendingEnrollments,
            isStatusViewPendingCoverage: value.isStatusViewPendingCoverage,
            status: value.status,
            type: value.type,
            typeId: typeId,
            typeCode: value.typeCode,
            requestedCoverageEndDate: value.requestedCoverageEndDate,
            memberId: this.MemberInfo.id,
            acceptableFormats: this.acceptableFormats,
            createdBy: value.createdBy,
            createMethod: value.createMethod,
        };
        return specificEvent;
    }

    openPendingEnrollmentDialog(element: any, event: any): void {
        this.eventTypes.forEach((ele) => {
            if (ele.description === element.type) {
                this.selecteEvent = ele;
            }
        });
        this.pendingEnrollmentDialogRef = this.dialog.open(PendingEnrollmentComponent, {
            minWidth: "600px",
            data: {
                selectedVal: this.qleEventData(element),
                selecteEvent: this.selecteEvent,
                editLifeEvent: true,
            },
        });

        // this.pendingEnrollmentDialogRef.afterClosed(); // This needs to be confirmed
        this.utilService.bindDialogOpenAndClose(this.pendingEnrollmentDialogRef);
    }

    /**
     * A life cycle hook called by Angular to indicate that Angular is done creating the component.
     * Initialize the directive or component after Angular first displays
     * the data-bound properties and sets the directive or component's input properties.
     * Calls GetMemberQualifyingLifeEvents API.
     * Based on user roles, different views are rendered.
     * Allows the user to take appropriate actions on the QLE created.
     * @returns void
     */
    ngOnInit(): void {
        this.authService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe((response: PermissionsModel[]) => {
            this.p = this.checkPermission(response);
        });
        this.staticService
            .getConfigurations(this.ALLOWED_FILE_TYPE_CONFIG, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => (this.acceptableFormats = data[0].value));
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal === AppSettings.PORTAL_ADMIN) {
            this.isAdmin = true;
        }
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMember = true;
            this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                this.memberId = credential.memberId;
                this.mpGroupId = credential.groupId;
                this.MemberInfo = {};
                this.MemberInfo.id = this.memberId;
                this.store.dispatch(new GetQualifyingEventType(this.mpGroupId));
            });
        } else if (this.portal === AppSettings.PORTAL_ADMIN || this.portal === AppSettings.PORTAL_PRODUCER) {
            this.MemberInfo = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
            this.mpGroup = this.store.selectSnapshot(AccountListState.getGroup);
            this.mpGroupId = this.mpGroup.id;
            this.store.dispatch(new GetQualifyingEventType(this.mpGroupId));
            if (this.MemberInfo.firstName) {
                this.firstName = this.MemberInfo.firstName;
                this.showShopMenu = this.MemberInfo.status !== EmploymentStatus.TERMINATED;
            } else {
                this.memberService
                    .getMember(this.MemberInfo.id, true, this.mpGroupId.toString())
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((result) => {
                        if (result) {
                            this.firstName = result.body.name.firstName;
                            this.terminationDate = result.body.workInformation.termination.terminationDate as string;

                            if (this.terminationDate) {
                                this.showShopMenu = this.dateService.getIsAfterOrIsEqual(
                                    this.dateService.toDate(this.terminationDate),
                                    this.currentDate,
                                );
                            }
                            this.showShopButton =
                                result.body.workInformation.hireDate &&
                                this.dateService.isBeforeOrIsEqual(
                                    this.dateService.toDate(result.body.workInformation.hireDate || Date.now()),
                                );
                        }
                    });
            }
            if (this.mpGroup) {
                this.state = this.mpGroup.state;
            }
        }
        this.memberService.updateQLEList(true);
        this.memberService.isUpdated.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.loadLifeEvents();
            }
        });
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroupId.toString())
            .pipe(map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)));
        this.checkShopPageAccess();
        this.benefitsService
            .getApprovalRequests(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.benefitsOffered = !!resp?.length;
            });
    }

    checkPermission(response: PermissionsModel[]): boolean {
        return response.find((d) => String(d) === "core.benefitOffering.add.qualifyingLifeEvent") ? true : false;
    }

    /**
     * Function to check shop page access
     */
    checkShopPageAccess(): void {
        this.accountBusinessService
            .checkPermissions(this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([accountInfo, permissionConfig, groupAttribute, permissions]) => {
                this.isTpiAccount = accountInfo.thirdPartyPlatformsEnabled;
                this.showShopConfig = permissionConfig[0].value === TRUE_VALUE;
                this.isHqAccount = groupAttribute[0].attribute === HQ_ACCOUNT && groupAttribute[0].value === BooleanConst.TRUE;
                if (permissions.length > 0) {
                    this.shopPermission = Boolean(permissions.some((resp) => String(resp) === Permission.RESTRICT_SHOP));
                }
                this.isShopEnabled = !(this.shopPermission && this.showShopConfig && this.isTpiAccount && !this.isHqAccount);
            });
    }

    /**
     * Method to open enrollment popup to navigate to shop page.
     * @param qleId QLE id
     */
    openShopPopUp(qleId: number): void {
        if (this.benefitsOffered) {
            this.store.dispatch(new SetIdToCloseSEP(qleId));
            this.dualPlanYearService.genericShopOeQLeNavigate(this.MemberInfo.id, this.mpGroupId);
            this.dialog.open(EnrollmentMethodComponent, {
                backdropClass: "backdrop-blur",
                maxWidth: "600px", // 600px max-width based on the definition in abstract.
                panelClass: "shopping-experience",
                data: {
                    mpGroup: this.mpGroupId,
                    detail: this.MemberInfo,
                    route: this.route,
                    stateAbbr: this.mpGroup.state || this.mpGroup.situs.state.abbreviation,
                    openingFrom: LIFE_EVENT,
                },
            });
        } else {
            this.isLoading = true;
            // eslint-disable-next-line max-len
            const url = `/producer/payroll/${this.mpGroupId}/member/${this.MemberInfo.id}/enrollment/quote-shop/${this.mpGroupId}/specific/${this.MemberInfo.id}`;
            this.router
                .navigateByUrl(`/producer/payroll/${this.mpGroupId}/member/${this.MemberInfo.id}`, {
                    skipLocationChange: true,
                })
                .then(() => this.router.navigate([url]));
        }
    }
    /**
     * Loads the list of Qualifying Life Events
     * @returns void
     */
    loadLifeEvents(): void {
        this.isLoading = true;
        this.qleData = [];
        this.memberService
            .getMemberQualifyingEvents(this.MemberInfo.id, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: MemberQualifyingEvent[]) => {
                    response.forEach((qle) => {
                        const qleEvent: any = {
                            id: qle.id,
                            createDate: qle.createDate,
                            eventDate: qle.eventDate,
                        };
                        this.qleData.push(qleEvent);
                    });
                    if (response.length === 0) {
                        this.isLifeEvents = false;
                        this.isLoading = false;
                    } else {
                        this.isLifeEvents = true;
                        response.forEach((ele) => {
                            this.eventTypes.push(ele.type);
                        });
                        this.qleList = response;
                        this.qleList.sort((a, b) => b.id - a.id);
                        this.dataSource = this.qleList;
                        const type = [];
                        this.qleList.forEach((event) => {
                            type.push(event.type);
                        });
                        this.length = 0;
                        this.qleList.forEach((qle, index) => {
                            this.dataSource[index].type = type[index].description;
                            this.dataSource[index].typeCode = type[index].code;
                            this.dataSource[index].daysToReport = type[index].daysToReport;
                            this.dataSource[index].createdBy = qle.createdBy;
                            this.dataSource[index].createDate = this.datePipe.transform(qle.createDate, DateFormats.MONTH_DAY_YEAR);
                            this.dataSource[index].eventDate = this.datePipe.transform(qle.eventDate, DateFormats.MONTH_DAY_YEAR);
                            const eventDate: Date = this.dateService.toDate(this.dataSource[index].eventDate);
                            this.eventExpireDate.setDate(
                                eventDate.getDate() + parseInt(this.dataSource[index].daysToReport.toString(), 10),
                            );
                            if (qle.status === StatusType.DENIED) {
                                this.viewDetails(index);
                                this.length++;
                                if (this.qleList.length === 1 || this.length === this.qleList.length) {
                                    this.isLoading = false;
                                }
                            } else if (
                                qle.status === StatusType.APPROVED ||
                                qle.status === StatusType.PENDING ||
                                qle.status === StatusType.INPROGRESS
                            ) {
                                if (type[index].description === MemberQLETypes.BY_REQUEST) {
                                    this.viewByRequest(qle, index);
                                    this.length++;
                                    if (this.qleList.length === AppSettings.ONE || this.length === this.qleList.length) {
                                        this.isLoading = false;
                                    }
                                } else {
                                    if (qle.status === StatusType.APPROVED) {
                                        this.dataSource[index].isPending = false;
                                    } else if (qle.status === StatusType.PENDING) {
                                        this.dataSource[index].isPending = true;
                                    }
                                    this.memberService
                                        .getQLEEnrollments(this.MemberInfo.id, this.mpGroupId, this.dataSource[index].id)
                                        .pipe(takeUntil(this.unsubscribe$))
                                        .subscribe((enrollment: Enrollment[]) => {
                                            this.length++;
                                            if (enrollment.length === 0) {
                                                this.dataSource[index].isNoEnrollment = true;
                                            } else {
                                                this.dataSource[index].enrollmentId = enrollment;
                                                this.dataSource[index].isNoEnrollment = false;
                                                this.dataSource[index].isApprovedEnrollment = false;
                                                this.dataSource[index].isPending = enrollment.find((enroll) => {
                                                    if (enroll.status === StatusType.PENDING) {
                                                        return true;
                                                    }
                                                    return false;
                                                });
                                                if (!this.dataSource[index].isPending) {
                                                    this.dataSource[index].isApprovedEnrollment = enrollment.find((enroll) => {
                                                        if (enroll.status === StatusType.APPROVED) {
                                                            return true;
                                                        }
                                                        return undefined;
                                                    });
                                                }
                                            }
                                            if (qle.status === StatusType.INPROGRESS) {
                                                this.displayInProgress(index);
                                            } else if (!this.dataSource[index].isNoEnrollment) {
                                                if (
                                                    (qle.status === StatusType.APPROVED && this.dataSource[index].isPending) ||
                                                    (qle.status === StatusType.PENDING && this.dataSource[index].isApprovedEnrollment) ||
                                                    (qle.status === StatusType.PENDING && this.dataSource[index].isPending)
                                                ) {
                                                    this.viewPendingEnrollments(index);
                                                } else {
                                                    this.viewDetails(index);
                                                }
                                            } else {
                                                this.viewDetails(index);
                                            }
                                            if (this.length === this.qleList.length || this.qleList.length === 1) {
                                                this.isLoading = false;
                                            }
                                        });
                                }
                            }
                        });
                    }
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * sets corresponding flags when qle type is By Request
     * @params qle: MemberQualifyingEvent, qualifying life event
     * @params index: number, index of the qle list element
     * @returns void
     */
    viewByRequest(qle: MemberQualifyingEvent, index: number): void {
        if (qle.endPlanRequestStatus === QLEEndPlanRequestStatus.PENDING_HR_APPROVAL && this.isAdmin) {
            this.viewPendingCoverage(index);
        } else {
            this.viewDetails(index);
        }
    }

    /**
     * method to display in progress QLEs
     * @param index: number, the index of the qle enrollment
     * @returns void
     */
    displayInProgress(index: number): void {
        this.dataSource[index].isPending = false;
        this.dataSource[index].status = StatusType.INPROGRESS;
        this.dataSource[index].isStatusInprogress = true;
        this.dataSource[index].isStatusViewDetails = false;
        this.dataSource[index].isStatusViewPendingEnrollments = false;
        this.dataSource[index].isStatusViewPendingCoverage = false;
    }

    /**
     * method to display view detail link
     * @param index: number, the index of the qle enrollment
     * @returns void
     */
    viewDetails(index: number): void {
        if (this.dataSource[index].type === MemberQLETypes.BY_REQUEST) {
            this.dataSource[index].type = this.languageStrings[this.LANGUAGE_PENDING_COVERAGE];
            this.dataSource[index].requestedCoverageEndDate = this.datePipe.transform(
                this.dataSource[index].requestedCoverageEndDate,
                AppSettings.DATE_FORMAT_MM_DD_YYYY,
            );
            if (this.dataSource[index].endPlanRequestStatus === QLEEndPlanRequestStatus.PENDING_HR_APPROVAL) {
                this.dataSource[index].status = StatusType.PENDING_HR_APPROVAL;
                this.dataSource[index].isPending = true;
            } else if (this.dataSource[index].endPlanRequestStatus === QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED) {
                this.dataSource[index].status = StatusType.PENDING_AFLAC_APPROVAL;
                this.dataSource[index].isPending = true;
            }
        }
        this.dataSource[index].isStatusViewDetails = true;
        this.dataSource[index].isStatusInprogress = false;
        this.dataSource[index].isStatusViewPendingEnrollments = false;
        this.dataSource[index].isStatusViewPendingCoverage = false;
    }

    /**
     * method to display view pending enrollments link
     * @param index: number, the index of the qle enrollment
     * @returns void
     */
    viewPendingEnrollments(index: number): void {
        this.dataSource[index].isStatusViewPendingEnrollments = true;
        this.dataSource[index].isStatusViewDetails = false;
        this.dataSource[index].isStatusInprogress = false;
        this.dataSource[index].isStatusViewPendingCoverage = false;
    }

    /**
     * method to display view pending coverage link
     * @param index: number, the index of the qle enrollment
     * @returns void
     */
    viewPendingCoverage(index: number): void {
        this.dataSource[index].isStatusViewPendingCoverage = true;
        this.dataSource[index].isPending = true;
        this.dataSource[index].isStatusViewPendingEnrollments = false;
        this.dataSource[index].isStatusViewDetails = false;
        this.dataSource[index].isStatusInprogress = false;
        this.dataSource[index].type = this.languageStrings[this.LANGUAGE_PENDING_COVERAGE];
        this.dataSource[index].status = StatusType.PENDING_HR_APPROVAL;
        this.dataSource[index].requestedCoverageEndDate = this.datePipe.transform(
            this.dataSource[index].requestedCoverageEndDate,
            AppSettings.DATE_FORMAT_MM_DD_YYYY,
        );
    }
    /**
     * @description checks the status and returns appropriate message string
     * @param statusValue {string}
     * @returns the appropriate message {string}
     */
    displayStatusValue(statusValue: string): string | undefined {
        switch (statusValue) {
            case StatusType.INPROGRESS:
                return "primary.portal.qle.inProgressText";
                break;
            case StatusType.APPROVED:
                return "primary.portal.qle.approvedText";
                break;
            case StatusType.DENIED:
                return "primary.portal.qle.deniedText";
                break;
            case StatusType.PENDING:
                return "primary.portal.qle.pendingText";
                break;
            case StatusType.PENDING_HR_APPROVAL:
                return "primary.portal.qle.pendingHrApproval";
                break;
            case StatusType.PENDING_AFLAC_APPROVAL:
                return "primary.portal.qle.pendingAflacApproval";
                break;
        }
        return undefined;
    }

    /**
     * Method to change QLE status
     * @param id: QLE id
     */
    changeStatus(id: any): void {
        this.dataSource.forEach((qle) => {
            if (qle.id === id) {
                this.changedQLE.eventDate = qle.eventDate;
                this.changedQLE.eventDate = this.datePipe.transform(this.changedQLE.eventDate, "yyyy-MM-dd");
                this.changedQLE.enrollmentValidity = {
                    expiresAfter: this.datePipe.transform(this.dateService.subtractDays(new Date(), ONE_DAY), DateFormats.YEAR_MONTH_DAY),
                    effectiveStarting: this.datePipe.transform(
                        this.dateService.subtractDays(new Date(), ONE_DAY),
                        DateFormats.YEAR_MONTH_DAY,
                    ),
                };
                if (!this.isMember) {
                    this.changedQLE.adminComment = qle.adminComment;
                } else {
                    this.changedQLE.memberComment = qle.memberComment;
                }

                this.changedQLE.coverageStartDates = [];

                this.changedQLE.status = StatusType.APPROVED;

                this.changedQLE.documentIds = [];
                if (qle.documents.length > 0) {
                    qle.documents.forEach((doc) => {
                        this.changedQLE.documentIds.push(doc.id);
                    });
                } else {
                    this.changedQLE.documentIds = [];
                }

                this.eventTypes.forEach((event) => {
                    if (qle.type === event.description) {
                        this.changedQLE.typeId = event.id;
                    }
                });
            }
        });
        this.memberService
            .updateMemberQualifyingEvent(this.MemberInfo.id, id, this.changedQLE, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.errorResponse = false;
                    this.isLoading = false;
                    this.memberService.updateQLEList(true);
                },
                (error) => {
                    this.errorResponse = true;
                    this.isLoading = false;
                    if (error.status === AppSettings.API_RESP_400) {
                        this.errorMessage = "secondary.portal.qle.qleExists";
                    } else if (error.status === AppSettings.API_RESP_409) {
                        this.errorMessage = "secondary.portal.qle.pendingEnrollment.duplication.error";
                    }
                },
            );
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
