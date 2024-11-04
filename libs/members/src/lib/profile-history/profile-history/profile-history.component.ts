import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy } from "@angular/core";
import { PageEvent, MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { DatePipe } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { MemberService, AuditDemographic, ChangeType, Content, AccountService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Subject, Subscription } from "rxjs";
import { NgxMaskPipe } from "ngx-mask";
import { DateFormats, AppSettings, MemberProfile, MemberDependent } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { DateService } from "@empowered/date";
import { takeUntil } from "rxjs/operators";

const DIRECT = "direct";
@Component({
    selector: "empowered-profile-history",
    templateUrl: "./profile-history.component.html",
    styleUrls: ["./profile-history.component.scss"],
})
export class ProfileHistoryComponent implements OnInit, OnDestroy {
    test = false;
    panelOpenState = false;
    loop = [];
    isopen = false;
    pageSizeOptions = AppSettings.historyPageSizeOptions;
    pageEvent: PageEvent;
    nameOptions: any[] = [];
    changeTypes: string[];
    demographicsForm: FormGroup;
    paginatorForm: FormGroup;
    mpGroup: number;
    memberId: number;
    maxStartDate = new Date();
    maxEndDate = new Date();
    isDateInvalid = false;
    auditDemographics: AuditDemographic;
    DATE_FORMAT_MM_DD_YYYY: string;
    memberDependents: MemberDependent[];
    memberinfo: HttpResponse<MemberProfile>;
    changetypeEnum = ChangeType;
    selectedChangeType: string;
    selectedDependentId: number;
    dataSource = new MatTableDataSource<Content>();
    @ViewChild(MatPaginator) paginator: MatPaginator;
    dateTimeFormat = AppSettings.DATE_TIME_FORMAT_HR_MN;
    displayedColumns = ["page"];
    PAGINATORINPUT = "paginatorInput";
    USERTYPESELECT = "userTypeSelect";
    WORK = "WORK";
    ALL = "All";
    ENDDATE = "endDate";
    changeTypeValue: string;
    isLoading: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    relations: any[];
    isDirect: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.dateHint",
        "primary.portal.activityHistory.startDate",
        "primary.portal.common.endDate",
        "primary.portal.common.requiredField",
        "primary.portal.activityHistory.profile",
        "primary.portal.activityHistory.whoseInfo",
        "primary.portal.activityHistory.change",
        "primary.portal.activityHistory.dateFuture",
        "primary.portal.activityHistory.dateRange",
        "primary.portal.activityHistory.of",
        "primary.portal.activityHistory.found",
        "primary.portal.activityHistory.invalidDateFormat",
        "primary.portal.activityHistory.previous",
        "primary.portal.activityHistory.new",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.changesFound",
        "primary.portal.activityHistory.profileResults",
        "primary.portal.activityHistory.No",
        "primary.portal.activityHistory.profileLabel",
        "primary.portal.activityHistory.empLabel",
        "primary.portal.common.page",
        "primary.portal.activityHistory.custLabel",
    ]);
    EMPLOYEE = this.languageStrings["primary.portal.activityHistory.empLabel"];
    CUSTOMER = this.languageStrings["primary.portal.activityHistory.custLabel"];

    constructor(
        private readonly fb: FormBuilder,
        private readonly datepipe: DatePipe,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly memberService: MemberService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly dateService: DateService,
    ) {
        this.changeTypes = Object.keys(this.changetypeEnum).filter(String);
    }

    /**
     * Angular life-cycle hook: ngOnInit
     * Set the required data at component initialization.
     * It also holds business logic to determine if it is direct or not.
     */
    ngOnInit(): void {
        this.selectedChangeType = "";
        this.selectedDependentId = 0;
        this.mpGroup = this.route.snapshot.parent.parent.params.mpGroupId;
        this.memberId = this.route.snapshot.parent.parent.params.memberId
            ? this.route.snapshot.parent.parent.params.memberId
            : this.route.snapshot.parent.parent.params.customerId;
        this.DATE_FORMAT_MM_DD_YYYY = AppSettings.DATE_FORMAT_MM_DD_YYYY;
        this.demographicsForm = this.fb.group({
            startDate: [""],
            endDate: [this.maxEndDate, Validators.required],
            changeTypeSelect: [this.ALL],
            userTypeSelect: [],
        });
        this.paginatorForm = this.fb.group({
            paginatorInput: [""],
        });
        this.nameOptions.push({ Id: this.memberId, Name: "" });
        if (this.router.url.includes(DIRECT)) {
            this.isDirect = true;
        }
        this.isDateInvalid = true;
        this.getMember();
        this.createListner();
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

    searchDemographics(): void {
        if (this.demographicsForm.valid) {
            const auditStartDate = this.datepipe.transform(this.demographicsForm.value.startDate, AppSettings.DATE_FORMAT);
            const auditEndDate = this.datepipe.transform(this.demographicsForm.value.endDate, AppSettings.DATE_FORMAT);
            this.getDemographicsAudits(auditStartDate, auditEndDate);
            this.changeTypeValue = this.changetypeEnum[this.demographicsForm.get("changeTypeSelect").value];
        }
    }

    getDependentRelations(): void {
        this.accountService
            .getDependentRelations(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.relations = res;
                    this.getMemberDependents();
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getMemberDependents(): void {
        this.memberService
            .getMemberDependents(this.memberId, false, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (dependents) => {
                    this.memberDependents = dependents;
                    dependents.forEach((element) => {
                        this.nameOptions.push({
                            Id: element.id,
                            Name:
                                element.name.firstName +
                                " " +
                                element.name.lastName +
                                " (" +
                                this.relations.find((x) => x.id === element.dependentRelationId).name.toLowerCase() +
                                ")",
                        });
                    });
                    this.isLoading = false;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * This function is used to get member details.
     */
    getMember(): void {
        this.isLoading = true;
        this.memberService
            .getMember(this.memberId, false, this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (info) => {
                    this.memberinfo = info;
                    this.nameOptions[0].Name = `${info.body.name.firstName} ${info.body.name.lastName}${
                        this.isDirect ? this.CUSTOMER : this.EMPLOYEE
                    }`;
                    this.demographicsForm.get(this.USERTYPESELECT).patchValue(this.nameOptions[0].Id);
                    this.getDependentRelations();
                },
                () => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * Function to get the details of profile audit for an employee
     * @param auditStartDate start date of audit details to be fetched
     * @param auditEndDate end date of audit details to be fetched
     */
    getDemographicsAudits(auditStartDate: string, auditEndDate: string): void {
        this.isLoading = true;
        if (this.selectedDependentId === +this.memberId) {
            this.selectedDependentId = 0;
        }
        if (this.selectedChangeType === undefined || this.selectedChangeType === this.ALL) {
            this.selectedChangeType = "";
        }
        this.memberService
            .getDemographicsAudits(
                auditStartDate,
                auditEndDate,
                this.memberId,
                this.mpGroup,
                this.selectedDependentId,
                this.selectedChangeType,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.isLoading = false;
                    this.auditDemographics = res;
                    this.auditDemographics.content.sort(
                        (date1, date2) => this.dateService.toDate(date2.on).getTime() - this.dateService.toDate(date1.on).getTime(),
                    );
                    this.changeDetector.detectChanges();
                    this.auditDemographics.content.forEach((auditMap) => {
                        auditMap.newValue = this.convertedDateFormat(auditMap.newValue);
                        auditMap.oldValue = this.convertedDateFormat(auditMap.oldValue);
                    });
                    this.dataSource = new MatTableDataSource<Content>(this.auditDemographics.content);
                    if (this.auditDemographics.content.length > 10) {
                        this.dataSource.paginator = this.paginator;
                        this.paginatorForm.get(this.PAGINATORINPUT).patchValue(1);
                        this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
                            this.paginatorForm.get(this.PAGINATORINPUT).patchValue(page.pageIndex + 1);
                        });
                    }
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * Function to validate the input date with specific format and return the converted format
     * @param dateValue input date from API response
     * @returns string converted date format
     */
    convertedDateFormat(dateValue: string): string {
        const formattedDateObject = this.dateService.format(this.dateService.toDate(dateValue), DateFormats.YEAR_MONTH_DAY);
        return this.dateService.isValid(this.dateService.toDate(formattedDateObject))
            ? this.dateService.format(this.dateService.toDate(dateValue), DateFormats.MONTH_DAY_YEAR)
            : dateValue;
    }

    /**
     * Method to validate the date
     * @param control - formControlName
     * @param event - date field value
     * @returns string format of date value
     */
    validateDate(control: string, event: string): string {
        const formControlValue = this.demographicsForm.get(control).value;
        if (!formControlValue && event !== "") {
            return this.languageStrings["primary.portal.activityHistory.invalidDateFormat"];
        }
        if (!formControlValue) {
            this.demographicsForm.get(control).reset();
        }
        return undefined;
    }

    onChangeTypeChange(value: string): void {
        if (value !== undefined) {
            this.selectedChangeType = value;
        }
    }

    onUserTypeChange(value: string): void {
        if (value !== undefined) {
            this.selectedDependentId = +value;
        }
    }

    assignMaxStartDate(): void {
        this.maxStartDate =
            this.datepipe.transform(this.demographicsForm.value.endDate, AppSettings.DATE_FORMAT) &&
            this.datepipe.transform(this.demographicsForm.value.endDate, AppSettings.DATE_FORMAT) <
                this.datepipe.transform(this.maxEndDate, AppSettings.DATE_FORMAT)
                ? this.demographicsForm.get(this.ENDDATE).value
                : this.maxEndDate;
    }

    createListner(): void {
        this.demographicsForm
            .get(this.USERTYPESELECT)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                if (res !== this.memberId) {
                    this.changeTypes = this.changeTypes.filter((x) => x !== this.WORK);
                } else {
                    this.changeTypes = Object.keys(this.changetypeEnum).filter(String);
                }
            });
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
