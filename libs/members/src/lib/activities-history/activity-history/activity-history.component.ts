import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { PageEvent, MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { AppSettings } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { MemberService, AuditActivity } from "@empowered/api";
import { Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-activity-history",
    templateUrl: "./activity-history.component.html",
    styleUrls: ["./activity-history.component.scss"],
})
export class ActivityHistoryComponent implements OnInit, OnDestroy {
    outerDisplayedColumns: string[] = ["page"];
    innerDisplayedColumns: string[] = ["page", "time"];
    activityForm: FormGroup;
    paginatorForm: FormGroup;
    mpGroup: number;
    memberId: number;
    maxStartDate = new Date();
    maxEndDate = new Date();
    currentDate = new Date();
    isDateInvalid = false;
    auditActivities: AuditActivity[];
    pageSizeOptions = AppSettings.historyPageSizeOptions;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    dataSource = new MatTableDataSource<AuditActivity>();
    dateTimeFormat = AppSettings.DATE_TIME_FORMAT_HR_MN;
    timeFormat = AppSettings.TIME_FORMAT_HR_MN;
    isLoading = false;
    subscription: Subscription[] = [];
    PAGINATORINPUT = "paginatorInput";
    ENDDATE = "endDate";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.dateHint",
        "primary.portal.activityHistory.startDate",
        "primary.portal.common.endDate",
        "primary.portal.common.requiredField",
        "primary.portal.activityHistory.activity",
        "primary.portal.activityHistory.dateFuture",
        "primary.portal.activityHistory.dateRange",
        "primary.portal.activityHistory.activityResult",
        "primary.portal.activityHistory.page",
        "primary.portal.activityHistory.time",
        "primary.portal.activityHistory.found",
        "primary.portal.activityHistory.of",
        "primary.portal.activityHistory.invalidDateFormat",
        "primary.portal.activityHistory.No",
        "primary.portal.activityHistory.activeMultiple",
        "primary.portal.activityHistory.loginMulti",
        "primary.portal.activityHistory.loginSingle",
        "primary.portal.activityHistory.searchProducer",
        "primary.portal.activityHistory.paginatorInput",
        "primary.portal.common.page",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly datepipe: DatePipe,
        private readonly route: ActivatedRoute,
        private readonly memberService: MemberService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.subscription.push(
            this.route.parent.parent.params.subscribe((params) => {
                this.mpGroup = +params["mpGroupId"] ? +params["mpGroupId"] : +params["mpGroup"];
                this.memberId = +params["memberId"] ? +params["memberId"] : +params["customerId"];
            }),
        );
        this.activityForm = this.fb.group({
            startDate: [""],
            endDate: [this.maxEndDate, Validators.required],
        });
        this.paginatorForm = this.fb.group({
            paginatorInput: [""],
        });
        this.isDateInvalid = true;
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

    searchActivities(): void {
        if (this.activityForm.valid) {
            this.isLoading = true;
            const auditStartDate = this.datepipe.transform(this.activityForm.value.startDate, AppSettings.DATE_FORMAT);
            const auditEndDate = this.datepipe.transform(this.activityForm.value.endDate, AppSettings.DATE_FORMAT);
            this.getActivityAudits(auditStartDate, auditEndDate);
        }
    }

    getActivityAudits(auditStartDate: string, auditEndDate: string): void {
        this.subscription.push(
            this.memberService.getActivityAudits(auditStartDate, auditEndDate, this.memberId, this.mpGroup).subscribe(
                (res) => {
                    this.auditActivities = res;
                    this.auditActivities.sort(
                        (date1, date2) => this.dateService.toDate(date2.on).getTime() - this.dateService.toDate(date1.on).getTime(),
                    );
                    this.changeDetector.detectChanges();
                    this.dataSource = new MatTableDataSource<AuditActivity>(this.auditActivities);
                    if (this.auditActivities.length > 10) {
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

    /**
     * Method to validate the date
     * @param control - formControlName
     * @param event - date field value
     * @returns string format of date value
     */
    validateDate(control: string, event: string): string {
        const formControlValue = this.activityForm.get(control).value;
        if (!formControlValue && event !== "") {
            return this.languageStrings["primary.portal.activityHistory.invalidDateFormat"];
        }
        if (!formControlValue) {
            this.activityForm.get(control).reset();
        }
        return undefined;
    }

    assignMaxStartDate(): void {
        this.maxStartDate =
            this.datepipe.transform(this.activityForm.value.endDate, AppSettings.DATE_FORMAT) &&
            this.datepipe.transform(this.activityForm.value.endDate, AppSettings.DATE_FORMAT) <
                this.datepipe.transform(this.maxEndDate, AppSettings.DATE_FORMAT)
                ? this.activityForm.get(this.ENDDATE).value
                : this.maxEndDate;
    }

    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
