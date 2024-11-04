import { Router, ActivatedRoute } from "@angular/router";
import {
    EnrollmentService,
    MemberService,
    AccountPendingEnrollmentsTable,
    AccountEnrollmentModel,
    RangeFilterModel,
    AccountPESearchModel,
    PendingEnrollmentReason,
} from "@empowered/api";
import { Component, OnInit, ViewChild, ElementRef, Injector, OnDestroy } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { DataFilter } from "@empowered/ui";
import { AppSettings, Enrollments, MemberProfile, MemberQualifyingEvent } from "@empowered/constants";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { FormControl } from "@angular/forms";
import { MatSelect } from "@angular/material/select";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Subscription, of, forkJoin, Observable, Subject } from "rxjs";
// TODO: PortalInjector is deprecated
// Switch to Injector.create or use the following resources to refactor:
// https://github.com/angular/material.angular.io/issues/701
// https://github.com/angular/angular/issues/35548#issuecomment-588551120
import { PortalInjector, ComponentPortal } from "@angular/cdk/portal";
import { OverlayPositionBuilder, Overlay, OverlayRef, OverlayConfig } from "@angular/cdk/overlay";
import { MoreFilterComponent } from "../../more-filter/more-filter.component";
import { CONTAINER_DATA } from "../../container-data";
import { tap, filter, mergeMap, catchError, takeUntil } from "rxjs/operators";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { UserService } from "@empowered/user";
import {
    AccountListState,
    BreakpointData,
    BreakPointUtilService,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

/**
 * This function is used to fetch pending reason from language table.
 * @param reason pending enrollment reason.
 * @param language of type language service used to fetch language from db.
 * @param titleCasePipe used to change the first letter of each word into the uppercase.
 * @param status  used to fetch enrollment status.
 * @returns fetching reason from language table.
 */
export function getPendingReasonLanguage(reason: string, language: LanguageService, titleCasePipe: TitleCasePipe, status: boolean): string {
    const GLOBAL_REGEX = /_/g;
    const pendingReason = titleCasePipe.transform(reason.toLocaleLowerCase().replace(GLOBAL_REGEX, " ")).replace(/\s+/g, "");
    if (status) {
        return language.fetchPrimaryLanguageValue(`primary.portal.pendingApplication.status.${pendingReason}`);
    }
    return language.fetchPrimaryLanguageValue(`primary.portal.pendingApplication.reason.${pendingReason}`);
}

const REASON_UNSPECIFIED = "Unspecified";
const coverageDateFilterName = "coverageDatesFilter";
const createdDateFilterName = "createDateFilter";
const coveragePropertyName = "coverageStarts";
const createDatePropertyName = "createdDate";
const ON_AFTER = "On or after";
const ON_BEFORE = "On or before";
const ID_ONE = 1;
const ID_TWO = 2;
const ADMIN_URL = "accountList";
const PRODUCER_URL = "payroll";
const ADMIN_ID_VAR = "adminId";
const INVALID = "INVALID";
const DIRECT = "direct";

@Component({
    selector: "empowered-account-pending-enrollments",
    templateUrl: "./account-pending-enrollments.component.html",
    styleUrls: ["./account-pending-enrollments.component.scss"],
    providers: [DataFilter],
})
export class AccountPendingEnrollmentsComponent implements OnInit, OnDestroy {
    mpGroupId: number;
    today = new Date();
    isLoading: boolean;
    displayedColumns = ["employee", "products", "reason", "createdDate", "coverageStarts", "status"];
    dataSource: {
        employee: {
            id: any;
            name: string;
            ssn: any;
        };
        data: any[];
    }[] = [];
    filterValue: any[] = [];
    memberId: any;
    memberObject: MemberProfile;
    memberQualifyingEvent: MemberQualifyingEvent[];
    sampleData = [];
    pendingEnrollments: any[] = [];
    count = 0;
    errorResponse: boolean;
    statusFilter = new FormControl([]);
    productFilter = new FormControl([]);
    createDateFilterDropDown = new FormControl("");
    createDateFilter = new FormControl(this.today);
    coverageDatesFilterDropDown = new FormControl("");
    coverageDateFilter = new FormControl(this.today);
    reasonFilter = new FormControl([]);
    searchField = new FormControl("");
    errorMessage: string;
    reasons: string[] = [];
    options = [];
    subscriberWithPE: number[] = [];
    subscriberDetails: MemberProfile[] = [];
    subscriberQualifyingEvents: any[] = [];
    pendingEnrollment: any[] = [];
    EnrollmentSourceData: AccountEnrollmentModel[] = [];
    statusFilterDropdowndata = [];
    productFilterDropdowndata = [];
    @ViewChild("statusFilterDropdown") statusFilterDropdown: MatSelect;
    @ViewChild("productFilterDropdown") productFilterDropdown: MatSelect;
    @ViewChild("reasonFilterDropdown") reasonFilterDropdown: MatSelect;
    @ViewChild("coverageFilterDropdown") coverageFilterDropdown: MatSelect;
    @ViewChild("createdFilterDropdown") createdFilterDropdown: MatSelect;
    @ViewChild("moreFilterOrigin") moreFilterOrigin: ElementRef;

    forMobileDevices = false;
    forMediumDevices = false;
    filterChoiceStatus: any;
    statusFlag: boolean;
    statusOnClick: any;
    filterChoiceProduct: any;
    productFlag: boolean;
    productOnClick: any;
    reasonOnClick: any;
    filterChoiceReason: any;
    reasonTypeFlag: boolean;
    filter = {
        query: {
            status: [],
            product: [],
            reason: [],
            reasonTypes: [],
        },
        ranges: {
            createdDate: [],
            coverageStarts: [],
        },
    };
    coverageFlag: boolean;
    coverageDateFilterOnClick = "";
    coverageDatesFilterDropDownOnClick = "";
    createDateFlag: boolean;
    createDateFilterOnClick = "";
    createDatesFilterDropDownOnClick = "";
    routeAfterLogin: any;
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    employeeSearchData: any[] = [];
    searchFlag: boolean;
    enrollmentDataForTable: any[] = [];
    maxEnrollmentStartDate: string | Date = "";
    overlayRef: OverlayRef;
    moreFilterResponse;
    moreFormControls;
    productSelectedData: any[] = [];
    reasonSelectedData: any[] = [];
    appliedFilter: any[] = [];
    BREAKPOINT_SIZES = AppSettings.BREAKPOINT_SIZES;
    allowCrossBorderCheck: boolean;
    subscriptions: Subscription[] = [];
    enrollmentGroupedArray = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountPendingEnrollments.account",
        "primary.portal.common.requiredField",
        "primary.portal.accountPendingEnrollments.pendingEnrollments",
        "primary.portal.accountPendingEnrollments.noPending",
        "primary.portal.accountPendingEnrollments.search",
        "primary.portal.accountPendingEnrollments.hint",
        "primary.portal.accountPendingEnrollments.filterStatus",
        "primary.portal.accountPendingEnrollments.filterCreatedDate",
        "primary.portal.accountPendingEnrollments.coverage",
        "primary.portal.accountPendingEnrollments.reason",
        "primary.portal.accountPendingEnrollments.products",
        "primary.portal.accountPendingEnrollments.employee",
        "primary.portal.accountPendingEnrollments.products",
        "primary.portal.accountPendingEnrollments.filterCreatedDate",
        "primary.portal.accountPendingEnrollment.noPendingEnrollments",
        "primary.portal.accountPendingEnrollment.name",
        "primary.portal.accountPendingEnrollment.ssn",
        "primary.portal.accountPendingEnrollment.multiple",
        "primary.portal.accountPendingEnrollment.guaranteed",
        "primary.portal.accountPendingEnrollment.unspecified",
        "primary.portal.accountPendingEnrollment.lifeEvent",
        "primary.portal.common.clear",
        "primary.portal.common.apply",
        "primary.portal.common.edit",
        "primary.portal.common.remove",
        "primary.portal.common.moreFilter",
        "primary.portal.accountPendingEnrollments.onOrAfter",
        "primary.portal.accountPendingEnrollments.onOrBefore",
        "primary.portal.enrollments.eaaRequiredStatus",
    ]);
    invalidDate: string;
    isDirect: boolean;

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    employeePEUrl: string;

    constructor(
        private readonly store: Store,
        private readonly enrollmentsService: EnrollmentService,
        private readonly memberService: MemberService,
        private readonly datePipe: DatePipe,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly dataFilter: DataFilter,
        private readonly language: LanguageService,
        private readonly elementRef: ElementRef,
        private readonly overlay: Overlay,
        private readonly overlayPositionBuilder: OverlayPositionBuilder,
        private readonly injector: Injector,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly utilService: UtilService,
        private readonly user: UserService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {
        this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
            if (resp.size === this.BREAKPOINT_SIZES.MD || resp.size === this.BREAKPOINT_SIZES.SM) {
                this.forMediumDevices = true;
                this.forMobileDevices = true;
            } else {
                this.forMediumDevices = false;
                this.forMobileDevices = false;
            }
        });

        this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
            if (resp.size === this.BREAKPOINT_SIZES.SM) {
                this.forMobileDevices = true;
            } else {
                this.forMobileDevices = false;
            }
        });
    }
    /**
     * This life cycle hook is called on component initialization to get pending enrollments data from back end
     * will also hold business logic to determine if it is direct or payroll flow.
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.staticUtilService.cacheConfigEnabled("general.feature.enable.cross_border_sales_rule").subscribe((resp) => {
                this.allowCrossBorderCheck = resp;
            }),
        );
        this.count = 0;
        this.options.push(this.languageStrings["primary.portal.accountPendingEnrollments.onOrAfter"]);
        this.options.push(this.languageStrings["primary.portal.accountPendingEnrollments.onOrBefore"]);
        this.routeAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        if (this.router.url.indexOf(DIRECT) >= 0) {
            this.mpGroupId = this.route.snapshot.params.mpGroupId;
            this.isDirect = true;
            this.getPendingEnrollments();
            this.employeePEUrl = `/producer/direct/customers/${this.mpGroupId}/##employee##/pending-applications/view-enrollments/manage`;
        } else {
            this.mpGroupId = this.store.selectSnapshot(AccountListState.getGroup).id;
            if (this.mpGroupId) {
                this.dataSource = [];
                this.getPendingEnrollments();
            }
            this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            });
            // eslint-disable-next-line max-len
            this.employeePEUrl = `${this.routeAfterLogin}/##portal##/${this.mpGroupId}/member/##employee##/pending-applications/view-enrollments/manage`;
        }
    }
    backToAccountList(): void {
        const url = `${this.routeAfterLogin}/payroll/`;
        this.router.navigate([url]);
    }

    /**
     * This function is used to filter enrollments based on status pending.
     * @returns void
     */
    getPendingEnrollments(): void {
        let memberDetails: MemberProfile[] = [];
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.enrollmentsService
            .getBusinessEnrollmentsWithStatusPending(this.mpGroupId)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((data) => {
                    this.isLoading = false;
                }),
                filter((data) => data && Object.keys(data).length > 0),
                tap((enrollments) => {
                    this.isLoading = true;
                    enrollments.forEach((employee) => {
                        if (
                            employee.pendingReason === PendingEnrollmentReason.CARRIER_APPROVAL ||
                            employee.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE ||
                            employee.pendingReason === PendingEnrollmentReason.PDA_COMPLETION ||
                            employee.pendingReason === PendingEnrollmentReason.INCOMPLETE_MISSING_EAA
                        ) {
                            (this.enrollmentGroupedArray[employee.member.id] = this.enrollmentGroupedArray[employee.member.id] || []).push(
                                employee,
                            );
                        }
                    });
                    Object.keys(this.enrollmentGroupedArray).forEach((employee) => {
                        this.subscriberWithPE.push(+employee);
                        this.pendingEnrollment.push(this.enrollmentGroupedArray[employee]);
                    });
                    if (!this.pendingEnrollment.length) {
                        this.isLoading = false;
                    }
                }),
                mergeMap((data) => this.getMemberDetails()),
                tap((data) => {
                    memberDetails = data.map((response) => response.body);
                }),
                mergeMap((data) => this.getQualifyingEventsServiceCall()),
                tap((data) => {
                    this.createAccountEnrollObj(memberDetails, data);
                    this.setDataToTable(this.EnrollmentSourceData);
                }),
            )
            .subscribe(
                (enrollments) => {
                    this.errorResponse = false;
                    this.isLoading = false;
                },
                (error) => {
                    this.displayDefaultError(error);
                },
            );
    }

    /**
     *
     * This function is used to push all enrollment information to enrollment data source var
     * @param memberDetails  MemberProfile[]
     * @param data {MemberQualifyingEvent[][]}
     * @returns void.
     */
    createAccountEnrollObj(memberDetails: MemberProfile[], data: MemberQualifyingEvent[][]): void {
        memberDetails.forEach((member, index) => {
            this.subscriberQualifyingEvents.push(data[index]);
            const enrollInfo: AccountEnrollmentModel = {
                employeeDetails: member,
                quaifyingLifeEvents: data[index],
                enrollments: this.pendingEnrollment[index],
            };
            this.EnrollmentSourceData.push(enrollInfo);
        });
    }

    /**
     *
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.errorResponse = true;
        this.isLoading = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }

    /**
     *
     *  This function is used to get member details
     * @returns {Observable<HttpResponse<MemberProfile>[]>}
     */
    getMemberDetails(): Observable<HttpResponse<MemberProfile>[]> {
        const memberServiceCalls: Observable<HttpResponse<MemberProfile>>[] = [];
        this.subscriberWithPE.forEach((subscriberId) => {
            memberServiceCalls.push(
                this.memberService.getMember(subscriberId, false, this.mpGroupId.toString()).pipe(catchError((error) => of(error))),
            );
        });
        return forkJoin(memberServiceCalls);
    }
    /**
     *
     * This function is used to get qle
     * @returns {Observable<MemberQualifyingEvent[][]>}
     */

    getQualifyingEventsServiceCall(): Observable<MemberQualifyingEvent[][]> {
        const memberQleServiceCalls: Observable<MemberQualifyingEvent[]>[] = [];
        this.subscriberWithPE.forEach((subscriberId) => {
            memberQleServiceCalls.push(
                this.memberService.getMemberQualifyingEvents(subscriberId, this.mpGroupId).pipe(catchError((error) => of(error))),
            );
        });
        return forkJoin(memberQleServiceCalls);
    }

    /**
     *
     * This function is used to set pending enrollment data into table
     * @param {AccountEnrollmentModel[]}
     * @returns void
     */
    setDataToTable(enrollmentData: AccountEnrollmentModel[]): void {
        enrollmentData.forEach((enrollInfo) => {
            const productDetails: AccountPendingEnrollmentsTable[] = [];
            enrollInfo.enrollments.forEach((enroll) => {
                this.arrangeTableData(enroll, productDetails, enrollInfo);
            });
            if (productDetails.length > 0) {
                const enrollData: AccountPESearchModel = {
                    employee: {
                        id: enrollInfo.employeeDetails.id,
                        name: `${enrollInfo.employeeDetails.name.lastName} ${enrollInfo.employeeDetails.name.firstName}`,
                        ssn: enrollInfo.employeeDetails.ssn,
                    },
                    data: productDetails,
                };
                this.dataSource.push(enrollData);
                this.pendingEnrollments.push(enrollData);
                this.enrollmentDataForTable.push(enrollData);
            }
        });
        this.productCountArrangement(this.enrollmentDataForTable);

        this.isLoading = false;
    }
    /**
     *
     * This function is used to arrange the pending enrollment in table
     * @param enroll Enrollments
     * @param productDetails AccountPendingEnrollmentsTable[]
     * @param enrollInfo AccountEnrollmentModel
     */
    arrangeTableData(enroll: Enrollments, productDetails: AccountPendingEnrollmentsTable[], enrollInfo: AccountEnrollmentModel): void {
        let pending;
        if (enroll.pendingCategory) {
            pending = enroll.pendingCategory.name;
        } else if (enroll.pendingReason) {
            pending = getPendingReasonLanguage(enroll.pendingReason, this.language, this.titleCasePipe, true);
        } else {
            pending = this.languageStrings["primary.portal.accountPendingEnrollment.unspecified"];
        }
        const reasonTypes: string[] = [];
        if (enroll.qualifyingEventId) {
            reasonTypes.push(this.languageStrings["primary.portal.accountPendingEnrollment.lifeEvent"]);
        }
        if (enroll.guaranteedIssue) {
            reasonTypes.push(this.languageStrings["primary.portal.accountPendingEnrollment.guaranteed"]);
        }
        if (enroll.pendingReason) {
            reasonTypes.push(getPendingReasonLanguage(enroll.pendingReason, this.language, this.titleCasePipe, false));
        }
        this.reasons.push(...reasonTypes);
        this.reasons = Array.from(new Set(this.reasons));
        if (enrollInfo.quaifyingLifeEvents.length) {
            enrollInfo.quaifyingLifeEvents.forEach((qle) => {
                if (qle.id === enroll.qualifyingEventId) {
                    this.arrangeProductDataTable(productDetails, enroll, reasonTypes, pending, qle);
                } else if (!enroll.qualifyingEventId) {
                    this.arrangeProductDataTable(productDetails, enroll, reasonTypes, pending);
                }
            });
        } else {
            this.arrangeProductDataTable(productDetails, enroll, reasonTypes, pending);
        }
    }
    /**
     * This function is used to arrange the data into product table
     * @param productDetails AccountPendingEnrollmentsTable
     * @param enroll  Enrollments
     * @param reasonTypes Pending reason type
     * @param pending if status is pending
     * @param qle MemberQualifyingEvent
     */
    arrangeProductDataTable(
        productDetails: AccountPendingEnrollmentsTable[],
        enroll: Enrollments,
        reasonTypes: string[],
        pending: string,
        qle?: MemberQualifyingEvent,
    ): void {
        const productDetailInfo: AccountPendingEnrollmentsTable = {
            product: enroll.plan.product.name,
            reason: qle ? qle.type.description : getPendingReasonLanguage(enroll.pendingReason, this.language, this.titleCasePipe, false),
            reasonTypes: reasonTypes,
            createdDate: this.datePipe.transform(enroll.createDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
            coverageStarts: this.datePipe.transform(enroll.validity.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
            status:
                !qle && enroll.pendingReason
                    ? getPendingReasonLanguage(enroll.pendingReason, this.language, this.titleCasePipe, true)
                    : pending,
        };
        productDetails.push(productDetailInfo);
        this.getMaxDate(productDetailInfo);
        let existingProduct: string[] = [];
        existingProduct = this.productFilterDropdowndata.filter((product) => product === enroll.plan.product.name);
        if (existingProduct.length === 0) {
            this.productFilterDropdowndata.push(enroll.plan.product.name);
        }
        let existingStatus: string[] = [];
        existingStatus = this.statusFilterDropdowndata.filter((sts) => sts === pending);
        if (existingStatus.length === 0 && pending !== REASON_UNSPECIFIED) {
            this.statusFilterDropdowndata.push(pending);
        }
    }

    getMaxDate(eachProduct: any): void {
        let existingDate = this.maxEnrollmentStartDate;
        if (existingDate === "") {
            existingDate = new Date();
        }
        if (this.dateService.toDate(existingDate) <= this.dateService.toDate(eachProduct.coverageStarts)) {
            this.maxEnrollmentStartDate = this.dateService.toDate(eachProduct.coverageStarts);
        } else {
            this.maxEnrollmentStartDate = this.dateService.toDate(existingDate);
        }
    }

    clickOutside(filterName: string): void {
        switch (filterName) {
            case "statusFilter":
                this.statusFilter.setValue(this.statusOnClick);
                this.statusFilterDropdown.close();
                break;
            case "productFilter":
                this.productFilter.setValue(this.productOnClick);
                this.productFilterDropdown.close();
                break;
            case "reasonFilter":
                this.reasonFilter.setValue(this.reasonOnClick);
                this.reasonFilterDropdown.close();
                break;
            case "coverageDatesFilter":
                this.coverageDateFilter.setValue(this.dateService.toDate(this.coverageDateFilterOnClick));
                this.coverageDatesFilterDropDown.setValue(this.coverageDatesFilterDropDownOnClick);
                this.coverageFilterDropdown.close();
                break;
            case "createDateFilter":
                this.createDateFilter.setValue(this.dateService.toDate(this.createDateFilterOnClick));
                this.createDateFilterDropDown.setValue(this.createDatesFilterDropDownOnClick);
                this.createdFilterDropdown.close();
                break;
        }
        this.filterApply(filterName);
    }

    /**
     * Function to set error to activate mat-error on inputting invalid date
     * @param date: the date parameter
     */
    dateValidation(date: FormControl): void {
        if (date.status === INVALID) {
            date.setErrors({ invalid: true });
            this.invalidDate = this.language.fetchSecondaryLanguageValue("secondary.portal.benefitsOffering.coveragedates.invalidDate");
        }
    }

    resetVal(filterName: string): void {
        switch (filterName) {
            case "statusFilter":
                this.statusOnClick = "";
                this.dataSource = this.pendingEnrollments;
                this.statusFilter.setValue([]);
                this.statusFilterDropdown.close();
                break;
            case "productFilter":
                this.productOnClick = "";
                this.dataSource = this.pendingEnrollments;
                this.productFilter.setValue([]);
                this.productFilterDropdown.close();
                this.productSelectedData = [];
                break;
            case "reasonFilter":
                this.reasonOnClick = "";
                this.dataSource = this.pendingEnrollments;
                this.reasonFilter.setValue([]);
                this.reasonFilterDropdown.close();
                this.reasonSelectedData = [];
                break;
            case "coverageDatesFilter":
                this.coverageDateFilterOnClick = "";
                this.coverageDatesFilterDropDownOnClick = "";
                this.coverageDatesFilterDropDown.setValue("");
                this.coverageDateFilter.setValue(null);
                this.coverageFilterDropdown.close();
                break;
            case "createDateFilter":
                this.createDateFilterOnClick = "";
                this.createDatesFilterDropDownOnClick = "";
                this.createDateFilterDropDown.setValue("");
                this.createDateFilter.setValue(null);
                this.createdFilterDropdown.close();
                break;
        }
        this.filterApply(filterName);
    }

    /**
     * Method used to apply filters on the data
     * @param filterName filter selected
     */
    filterApply(filterName: string): void {
        switch (filterName) {
            case "statusFilter":
                this.filterChoiceStatus = this.statusFilter.value;
                this.statusFlag = true;
                this.statusOnClick = this.filterChoiceStatus;
                this.filter.query.status = this.statusFilter.value;
                this.statusFilterDropdown.close();
                break;
            case "productFilter":
                this.filterChoiceProduct = this.productFilter.value;
                this.productFlag = true;
                this.productOnClick = this.filterChoiceProduct;
                this.filter.query.product = this.productFilter.value;
                this.productFilterDropdown.close();
                break;
            case "reasonFilter":
                this.filterChoiceReason = this.reasonFilter.value;
                this.reasonTypeFlag = true;
                this.reasonOnClick = this.filterChoiceReason;
                this.filter.query.reasonTypes = this.reasonFilter.value;
                this.reasonFilterDropdown.close();
                break;
            case "coverageDatesFilter":
                this.coverageFlag = true;
                this.coverageDateFilterOnClick = this.coverageDateFilter.value.toISOString();
                this.coverageDatesFilterDropDownOnClick = this.coverageDatesFilterDropDown.value;
                this.coverageFilterDropdown.close();
                if (this.coverageDateFilter.value && this.coverageDatesFilterDropDown.value === "") {
                    this.filter.ranges.coverageStarts = [];
                } else {
                    this.setRanges(filterName, this.coverageDateFilter.value, this.coverageDatesFilterDropDown.value);
                }
                break;
            case "createDateFilter":
                this.createDateFlag = true;
                this.createDateFilterOnClick = this.createDateFilter.value.toISOString();
                this.createDatesFilterDropDownOnClick = this.createDateFilterDropDown.value;
                this.createdFilterDropdown.close();
                if (this.createDateFilter.value && this.createDateFilterDropDown.value === "") {
                    this.filter.ranges.createdDate = [];
                } else {
                    this.setRanges(filterName, this.createDateFilter.value, this.createDateFilterDropDown.value);
                }
                break;
        }
        this.filterDataObject();
    }

    /**
     *
     * @param filterName  filter name selected by the user
     * @param dateValue date choosen by the user in form of Date or string
     * @param dropDownValue value selected in dropdown
     * @returns void.
     */
    setRanges(filterName: string, dateValue: Date | string, dropDownValue: string): void {
        if (filterName === coverageDateFilterName) {
            this.filter.ranges.coverageStarts = [];
            this.filter.ranges.coverageStarts.push(this.arrangeDate(dropDownValue, dateValue, coveragePropertyName));
        } else if (filterName === createdDateFilterName) {
            this.filter.ranges.createdDate = [];
            this.filter.ranges.createdDate.push(this.arrangeDate(dropDownValue, dateValue, createDatePropertyName));
        }
    }

    /**
     *
     * This function is used to arrange the coverage date in coverage date filter.
     * @param dropDownValue selected  value from dropdown in string datatype
     * @param dateValue coverage date in the type of Date or string
     * @param propertyName property name in string.
     * @returns {RangeFilterModel}. filtered data in the range of selected coverage date
     */
    arrangeDate(dropDownValue: string, dateValue: Date | string, propertyName: string): RangeFilterModel {
        if (dateValue === "") {
            dateValue = new Date().toDateString();
        }
        let rangeFilterVal: RangeFilterModel;
        if (dropDownValue === ON_AFTER) {
            rangeFilterVal = {
                id: ID_ONE,
                name: ON_AFTER,
                propertyName: propertyName,
                minValue: this.datePipe.transform(dateValue, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                maxValue: this.datePipe.transform(this.maxEnrollmentStartDate, AppSettings.DATE_FORMAT_MM_DD_YYYY),
            };
        }
        if (dropDownValue === ON_BEFORE) {
            rangeFilterVal = {
                id: ID_TWO,
                name: ON_BEFORE,
                propertyName: propertyName,
                minValue: "",
                maxValue: this.datePipe.transform(dateValue, AppSettings.DATE_FORMAT_MM_DD_YYYY),
            };
        }
        return rangeFilterVal;
    }
    /**
     * Method to filter enrollment data
     */
    filterDataObject(): void {
        this.dataSource = [];
        let enrollInfo: AccountPESearchModel[] = [];
        if (this.searchFlag) {
            enrollInfo = this.employeeSearchData;
        } else {
            enrollInfo = this.pendingEnrollments;
        }
        this.filter = this.utilService.copy(this.filter);
        enrollInfo.forEach((employeeDetails) => {
            let data = [];
            data = this.dataFilter.transform(employeeDetails.data, this.filter);
            if (data.length > 0) {
                const enroll = {
                    employee: {
                        id: employeeDetails.employee.id,
                        name: employeeDetails.employee.name,
                        ssn: employeeDetails.employee.ssn,
                    },
                    data: data,
                };
                this.dataSource.push(enroll);
            }
        });
        this.productCountArrangement(this.dataSource);
    }

    /**
     * This method navigates user to employee-level pending enrollments screen
     * @param employeeId is the selected employee id
     */
    navigateToEmployee(employeeId: number): void {
        this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            this.employeePEUrl = this.employeePEUrl
                .replace("##portal##", ADMIN_ID_VAR in credential ? ADMIN_URL : PRODUCER_URL)
                .replace("##employee##", employeeId.toString());
            this.router.navigate([this.employeePEUrl]);
        });
    }
    /**
     * this method is used for search Employee based name or ssn
     * @param value : text entered in search box
     */
    searchEmployee(value: string): void {
        if (value.length >= 3) {
            let fullName = "";
            fullName = value;
            const EmployeeEnroll = [];
            this.pendingEnrollments.forEach((employeeData) => {
                const name = employeeData.employee.name;
                // eslint-disable-next-line sonarjs/no-collapsible-if
                if (employeeData.employee.ssn !== undefined) {
                    if (employeeData.employee.ssn.includes(fullName)) {
                        const enroll = {
                            employee: {
                                id: employeeData.employee.id,
                                name: employeeData.employee.name,
                                ssn: employeeData.employee.ssn,
                            },
                            data: employeeData.data,
                        };
                        EmployeeEnroll.push(enroll);
                    } else {
                        this.filterDataObject();
                    }
                }
                if (name.toLowerCase().includes(fullName.toLowerCase())) {
                    const enroll = {
                        employee: {
                            id: employeeData.employee.id,
                            name: employeeData.employee.name,
                            ssn: employeeData.employee.ssn,
                        },
                        data: employeeData.data,
                    };
                    EmployeeEnroll.push(enroll);
                } else {
                    this.filterDataObject();
                }
            });
            this.searchFlag = true;
            this.employeeSearchData = EmployeeEnroll;
            this.filterDataObject();
        } else {
            this.searchFlag = false;
            this.employeeSearchData = this.pendingEnrollments;
            this.filterDataObject();
        }
    }

    /**
     *
     * This function is used to arrange the product count.
     * @param enrollInformation information required for enrollments.
     * @returns void
     */
    productCountArrangement(enrollInformation: any[]): void {
        if (!this.coverageDateFilter.value) {
            this.coverageDateFilter.setValue(this.today);
        }
        if (!this.createDateFilter.value) {
            this.createDateFilter.setValue(this.today);
        }
        const enrolls = this.utilService.copy(enrollInformation);
        const data = [];
        enrolls.forEach((employee) => {
            const enrollment: any[] = [];
            if (employee.data.length > 1) {
                const product: {
                    count: number;
                    productDetail: any[];
                }[] = [];
                employee.data.forEach((specificEnrollment) => {
                    const productDetails = employee.data.filter((eachData) => eachData.reason === specificEnrollment.reason);
                    const productObj = {
                        count: productDetails.length,
                        productDetail: productDetails,
                    };
                    // copy method of util is not able to stop duplication so, using  JSON.stringify()
                    if (
                        productDetails.length &&
                        product.findIndex((eachProduct) => JSON.stringify(eachProduct) === JSON.stringify(productObj)) === -1
                    ) {
                        product.push(productObj);
                    }
                });
                if (product.length > 1) {
                    const enrollmentList = [];
                    product.forEach((eachItem) => {
                        const prodName = [];
                        const statusName = [];
                        let createdDate = "";
                        let coverageStarts = "";
                        let reasonName = "";
                        if (eachItem.productDetail.length > 1) {
                            eachItem.productDetail.forEach((eachData) => {
                                let existingProduct = [];
                                existingProduct = prodName.filter((item) => item === eachData.product);
                                if (existingProduct.length === 0) {
                                    prodName.push(eachData.product);
                                }
                                let existingStatus = [];
                                existingStatus = statusName.filter((sts) => sts === eachData.status);
                                if (existingStatus.length === 0 && eachData.status !== REASON_UNSPECIFIED) {
                                    statusName.push(eachData.status);
                                }
                                reasonName = eachData.reason;
                                if (eachData.length > 1) {
                                    for (let index = 0; index < eachItem.productDetail.length - 1; index++) {
                                        if (
                                            this.dateService.toDate(eachItem.productDetail[index].createdDate) <=
                                            this.dateService.toDate(eachItem.productDetail[index + 1].createdDate)
                                        ) {
                                            createdDate = eachItem.productDetail[index].createdDate;
                                        } else {
                                            createdDate = eachItem.productDetail[index + 1].createdDate;
                                        }
                                        if (
                                            this.dateService.toDate(eachItem.productDetail[index].coverageStarts) <=
                                            this.dateService.toDate(eachItem.productDetail[index + 1].coverageStarts)
                                        ) {
                                            coverageStarts = eachItem.productDetail[index].coverageStarts;
                                        } else {
                                            coverageStarts = eachItem.productDetail[index + 1].coverageStarts;
                                        }
                                    }
                                } else {
                                    createdDate = eachItem.productDetail[0].createdDate;
                                    coverageStarts = eachItem.productDetail[0].coverageStarts;
                                }
                            });
                        } else {
                            let existingProduct = [];
                            existingProduct = prodName.filter((item) => item === eachItem.productDetail[0].product);
                            if (existingProduct.length === 0) {
                                prodName.push(eachItem.productDetail[0].product);
                            }
                            let existingStatus = [];
                            existingStatus = statusName.filter((sts) => sts === eachItem.productDetail[0].status);
                            if (existingStatus.length === 0 && eachItem.productDetail[0].status !== REASON_UNSPECIFIED) {
                                statusName.push(eachItem.productDetail[0].status);
                            }
                            reasonName = eachItem.productDetail[0].reason;
                            createdDate = eachItem.productDetail[0].createdDate;
                            coverageStarts = eachItem.productDetail[0].coverageStarts;
                        }
                        let statusCount = "";
                        if (statusName.length > 1) {
                            statusCount = "Multiple";
                        } else {
                            statusCount = "one";
                        }
                        let productTooltip = "";
                        prodName.forEach((item) => {
                            if (productTooltip === "") {
                                productTooltip = item;
                            } else {
                                productTooltip = productTooltip + ", " + item;
                            }
                        });
                        let statusTooltip = "";
                        statusName.forEach((item) => {
                            if (statusTooltip === "") {
                                statusTooltip = item;
                            } else {
                                statusTooltip = statusTooltip + "<br/>" + item;
                            }
                        });
                        const tableData = {
                            productCount: prodName.length,
                            productTooltip: productTooltip,
                            reason: reasonName,
                            createdDate: createdDate,
                            coverageStarts: coverageStarts,
                            status: statusTooltip,
                            statusCount: statusCount,
                        };
                        enrollmentList.push(tableData);
                    });
                    enrollment.push({
                        employee: employee.employee,
                        data: enrollmentList,
                    });
                } else {
                    const prodName = [];
                    const statusName = [];
                    let createdDate = "";
                    let coverageStarts = "";
                    let reasonName = "";
                    product[0].productDetail.forEach((eachData) => {
                        let existingProduct = [];
                        existingProduct = prodName.filter((item) => item === eachData.product);
                        if (existingProduct.length === 0) {
                            prodName.push(eachData.product);
                        } else {
                            product[0].count = product[0].count - existingProduct.length;
                        }
                        let existingStatus = [];
                        existingStatus = statusName.filter((sts) => sts === eachData.status);
                        if (existingStatus.length === 0 && eachData.status !== REASON_UNSPECIFIED) {
                            statusName.push(eachData.status);
                        }
                        reasonName = eachData.reason;
                        if (eachData.length > 1) {
                            for (let index = 0; index < product[0].productDetail.length - 1; index++) {
                                if (
                                    this.dateService.toDate(product[0].productDetail[index].createdDate) <=
                                    this.dateService.toDate(product[0].productDetail[index + 1].createdDate)
                                ) {
                                    createdDate = product[0].productDetail[index].createdDate;
                                } else {
                                    createdDate = product[0].productDetail[index + 1].createdDate;
                                }
                                if (
                                    this.dateService.toDate(product[0].productDetail[index].coverageStarts) <=
                                    this.dateService.toDate(product[0].productDetail[index + 1].coverageStarts)
                                ) {
                                    coverageStarts = product[0].productDetail[index].coverageStarts;
                                } else {
                                    coverageStarts = product[0].productDetail[index + 1].coverageStarts;
                                }
                            }
                        } else {
                            createdDate = product[0].productDetail[0].createdDate;
                            coverageStarts = product[0].productDetail[0].coverageStarts;
                        }
                    });
                    let statusCount = "";
                    if (statusName.length > 1) {
                        statusCount = "Multiple";
                    } else {
                        statusCount = "one";
                    }
                    let productTooltip = "";
                    prodName.forEach((item) => {
                        if (productTooltip === "") {
                            productTooltip = item;
                        } else {
                            productTooltip = productTooltip + ", " + item;
                        }
                    });
                    let statusTooltip = "";
                    statusName.forEach((item) => {
                        if (statusTooltip === "") {
                            statusTooltip = item;
                        } else {
                            statusTooltip = statusTooltip + "\n" + item;
                        }
                    });
                    const tableData = {
                        employee: employee.employee,
                        data: {
                            productCount: product[0].count,
                            productTooltip: productTooltip,
                            reason: reasonName,
                            createdDate: createdDate,
                            coverageStarts: coverageStarts,
                            status: statusTooltip,
                            statusCount: statusCount,
                        },
                    };
                    enrollment.push(tableData);
                }
            } else {
                const enroll = {
                    employee: employee.employee,
                    data: {
                        productCount: 1,
                        productTooltip: employee.data[0].product,
                        reason: employee.data[0].reason,
                        createdDate: employee.data[0].createdDate,
                        coverageStarts: employee.data[0].coverageStarts,
                        status: employee.data[0].status,
                        statusCount: "one",
                    },
                };
                enrollment.push(enroll);
            }
            data.push(enrollment);
        });
        this.dataSource = [];
        data.forEach((ele) => {
            this.dataSource.push(ele[0]);
        });

        this.dataSource.sort((a, b) => a.employee.name.localeCompare(b.employee.name));
    }

    /**
     * Method triggered on click of more option in smaller resolution
     */
    moreFilterView(): void {
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");
        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementRef)
            .withPositions([
                {
                    originX: "end",
                    originY: "bottom",
                    overlayX: "end",
                    overlayY: "top",
                },
            ])
            .withLockedPosition(true)
            .setOrigin(this.moreFilterOrigin);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            width: 350,
            maxHeight: 600,
            backdropClass: "expanded-card-view",
            panelClass: "account-list-more-view",
        });

        const popupComponentPortal = new ComponentPortal(
            MoreFilterComponent,
            null,
            this.createInjector([this.productFilterDropdowndata, this.reasons, this.productSelectedData, this.reasonSelectedData]),
        );
        this.overlayRef = this.overlay.create(overlayConfig);

        this.overlayRef
            .backdropClick()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.overlayRef.dispose();
                bodyElement.classList.remove("negate-blur");
            });

        const overlayInstance = this.overlayRef.attach(popupComponentPortal);
        overlayInstance.instance.filterApplied.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.moreFilterResponse = resp;
            this.filter.query.product = this.moreFilterResponse.selectedProductData;
            this.productSelectedData = this.moreFilterResponse.selectedProductData;

            this.filter.query.reasonTypes = this.moreFilterResponse.selectedReasonData;
            this.reasonSelectedData = this.moreFilterResponse.selectedReasonData;

            this.filterDataObject();
            this.overlayRef.dispose();
        });
        overlayInstance.instance.resetMoreFilterSubject.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.moreFormControls = resp;

            this.moreFormControls.forEach((each) => {
                this.resetVal("product");
                this.productSelectedData = [];
                this.filter.query.product = this.productSelectedData;

                this.resetVal("reason");
                this.reasonSelectedData = [];
                this.filter.query.reasonTypes = this.reasonSelectedData;

                this.filterDataObject();
            });

            this.overlayRef.dispose();
        });
    }
    createInjector(dataToPass: any[]): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(CONTAINER_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }
    /**
     *
     * This function is used to unsubscribe all the subscriptions .
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
