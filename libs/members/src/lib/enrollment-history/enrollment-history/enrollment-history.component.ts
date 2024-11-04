import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy } from "@angular/core";
import { PageEvent, MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { DatePipe } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { MemberService, AuditEnrollment, EnrollmentService, RecordType } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Subscription, forkJoin } from "rxjs";
import { NgxMaskPipe } from "ngx-mask";
import { DateFormats, AppSettings, Product } from "@empowered/constants";
import { DateService } from "@empowered/date";

const MP_GROUP = "mpGroup";
const MP_GROUP_ID = "mpGroupId";
const MEMBER_ID = "memberId";
const CUSTOMER_ID = "customerId";
const START_DATE = "startDate";

@Component({
    selector: "empowered-enrollment-history",
    templateUrl: "./enrollment-history.component.html",
    styleUrls: ["./enrollment-history.component.scss"],
})
export class EnrollmentHistoryComponent implements OnInit, OnDestroy {
    isopen = false;
    pageSizeOptions = AppSettings.historyPageSizeOptions;
    pageEvent: PageEvent;
    displayedColumns: string[] = ["name"];
    paginatorForm: FormGroup;
    mpGroup: number;
    memberId: number;
    dateTimeFormat = AppSettings.DATE_TIME_FORMAT_HR_MN;
    maxStartDate = new Date();
    maxEndDate = new Date();
    isDateInvalid = false;
    enrollmentHistoryForm: FormGroup;
    selectedProductId: number;
    selectedRecordType: string;
    auditEnrollment: AuditEnrollment[];
    dataSource = new MatTableDataSource<AuditEnrollment>();
    isDataFound = false;
    recordtypeEnum = RecordType;
    recordTypes: string[];
    isLoading: boolean;
    productList: Product[];
    PAGINATORINPUT = "paginatorInput";
    ALL = "All";
    ENDDATE = "endDate";
    RECORDTYPE = "recordType";
    PRODUCT = "product";
    subscription: Subscription[] = [];
    isDirect: boolean;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.dateHint",
        "primary.portal.activityHistory.startDate",
        "primary.portal.common.endDate",
        "primary.portal.common.requiredField",
        "primary.portal.activityHistory.enrollment",
        "primary.portal.activityHistory.noEnrollment",
        "primary.portal.activityHistory.recordType",
        "primary.portal.activityHistory.enrolResult",
        "primary.portal.activityHistory.planDetails",
        "primary.portal.activityHistory.coveredIndividuals",
        "primary.portal.activityHistory.underQues",
        "primary.portal.activityHistory.beneficiary",
        "primary.portal.activityHistory.enrollment",
        "primary.portal.activityHistory.dateFuture",
        "primary.portal.activityHistory.dateRange",
        "primary.portal.activityHistory.product",
        "primary.portal.activityHistory.found",
        "primary.portal.activityHistory.enroll",
        "primary.portal.activityHistory.of",
        "primary.portal.activityHistory.invalidDateFormat",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.all",
        "primary.portal.activityHistory.No",
        "primary.portal.activityHistory.activeSingle",
        "primary.portal.activityHistory.activeMultiple",
        "primary.portal.activityHistory.employerFunded",
        "primary.portal.common.page",
        "primary.portal.direct.activityHistory.noEnrollment",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly datepipe: DatePipe,
        private readonly route: ActivatedRoute,
        private readonly memberService: MemberService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly language: LanguageService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly maskPipe: NgxMaskPipe,
        private readonly dateService: DateService,
    ) {
        this.recordTypes = Object.keys(this.recordtypeEnum).filter(String);
    }

    /**
     * Angular life-cycle hook: ngOnInit
     * Initialize component data, enrollment form, paginator form and fetch member enrollments
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.selectedRecordType = "";
        this.selectedProductId = 0;
        this.productList = [];
        this.subscription.push(
            this.route.parent.parent.params.subscribe((params) => {
                this.isDirect = !!params[CUSTOMER_ID];
                this.mpGroup = +params[MP_GROUP_ID] ? +params[MP_GROUP_ID] : +params[MP_GROUP];
                this.memberId = +params[MEMBER_ID] ? +params[MEMBER_ID] : +params[CUSTOMER_ID];
            }),
        );

        this.enrollmentHistoryForm = this.fb.group({
            startDate: [""],
            endDate: [this.maxEndDate, Validators.required],
            recordTypeSelect: [this.ALL],
            productSelect: [this.ALL],
        });
        this.paginatorForm = this.fb.group({
            paginatorInput: [""],
        });
        this.searchMemberEnrollments();
        this.isDateInvalid = true;
    }

    /**
     * Method to validate start and end date
     * @param control form control name
     * @param event event value
     * @returns error string
     */
    validateDate(control: string, event: any): string | undefined {
        if (
            (this.enrollmentHistoryForm.get(control).value === null || this.enrollmentHistoryForm.get(control).value === "") &&
            event !== ""
        ) {
            return this.languageStrings["primary.portal.activityHistory.invalidDateFormat"];
        }
        if (control === START_DATE && event === "") {
            this.enrollmentHistoryForm.get(control).reset();
        }
        return undefined;
    }

    assignMaxStartDate(): void {
        this.maxStartDate =
            this.datepipe.transform(this.enrollmentHistoryForm.value.endDate, AppSettings.DATE_FORMAT) &&
            this.datepipe.transform(this.enrollmentHistoryForm.value.endDate, AppSettings.DATE_FORMAT) <
                this.datepipe.transform(this.maxEndDate, AppSettings.DATE_FORMAT)
                ? this.enrollmentHistoryForm.get(this.ENDDATE).value
                : this.maxEndDate;
    }
    /**
     * function to get the active enrollments of employee
     * @returns void
     */
    searchMemberEnrollments(): void {
        const date = new Date();
        const startDate = "";
        this.subscription.push(
            forkJoin([
                this.enrollmentsService.searchMemberEnrollments(this.memberId, this.mpGroup),
                this.memberService.getEnrollmentAudits(
                    startDate,
                    this.datepipe.transform(date, DateFormats.YEAR_MONTH_DAY),
                    this.memberId,
                    this.mpGroup,
                    this.selectedProductId,
                    this.selectedRecordType,
                ),
            ]).subscribe(
                ([activeEnrollment, auditHistory]) => {
                    if (activeEnrollment.length) {
                        activeEnrollment.forEach((item) => {
                            if (item.plan && item.plan.product) {
                                const index = this.productList.findIndex((x) => x.id === item.plan.product.id);
                                if (index === -1) {
                                    this.productList.push({ ...item.plan.product });
                                }
                            }
                        });
                        this.isDataFound = true;
                    } else {
                        this.isDataFound = auditHistory.length > 0;
                    }
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
    }

    searchEnrollmentAudits(): void {
        if (this.enrollmentHistoryForm.valid) {
            const auditStartDate = this.datepipe.transform(this.enrollmentHistoryForm.value.startDate, AppSettings.DATE_FORMAT);
            const auditEndDate = this.datepipe.transform(this.enrollmentHistoryForm.value.endDate, AppSettings.DATE_FORMAT);
            this.getEnrollmentAudits(auditStartDate, auditEndDate);
        }
    }
    /**
     * gets enrollment audits data
     * @param auditStartDate audit start date
     * @param auditEndDate audit end date
     */
    getEnrollmentAudits(auditStartDate: string, auditEndDate: string): void {
        this.isLoading = true;
        if (this.selectedRecordType === undefined || this.selectedRecordType === this.ALL) {
            this.selectedRecordType = "";
        }
        this.subscription.push(
            this.memberService
                .getEnrollmentAudits(
                    auditStartDate,
                    auditEndDate,
                    this.memberId,
                    this.mpGroup,
                    this.selectedProductId,
                    this.selectedRecordType,
                    true,
                )
                .subscribe(
                    (res) => {
                        this.auditEnrollment = res;
                        this.auditEnrollment.sort(
                            (enrollment1, enrollment2) =>
                                this.dateService.toDate(enrollment1.auditedEnrollment.createDate).getTime() -
                                this.dateService.toDate(enrollment2.auditedEnrollment.createDate).getTime(),
                        );
                        this.changeDetector.detectChanges();
                        this.dataSource = new MatTableDataSource<AuditEnrollment>(this.auditEnrollment);
                        if (this.auditEnrollment.length > 10) {
                            this.dataSource.paginator = this.paginator;
                            this.paginatorForm.get(this.PAGINATORINPUT).patchValue(1);
                            this.subscription.push(
                                this.paginator.page.subscribe((page: PageEvent) => {
                                    this.paginatorForm.get(this.PAGINATORINPUT).patchValue(page.pageIndex + 1);
                                }),
                            );
                        }
                        this.isLoading = false;
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                ),
        );
    }

    onSelectionChange(value: string, selectedoption: string): void {
        if (value !== undefined && selectedoption === this.RECORDTYPE) {
            this.selectedRecordType = value;
        } else if (value !== undefined && selectedoption === this.PRODUCT) {
            this.selectedProductId = +value;
        }
    }

    pageInputChanged(pageNumber: number): void {
        if (pageNumber !== null && pageNumber > 0 && pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
