import { Component, OnInit, Input, OnChanges, Inject, OnDestroy } from "@angular/core";
import { Enrollment, MemberService, EnrollmentService } from "@empowered/api";
import { PendingEnrollService } from "../services/pending-enroll.service";
import { Store } from "@ngxs/store";
import { AccountListState } from "@empowered/ngxs-store";
import { AppSettings, EnrollmentDependent, MemberDependent } from "@empowered/constants";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { PendingEnrollmentComponent } from "../pending-enrollment.component";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { DateService } from "@empowered/date";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-approval-denial-enrollments",
    templateUrl: "./approval-denial-enrollments.component.html",
    styleUrls: ["./approval-denial-enrollments.component.scss"],
})
export class ApprovalDenialEnrollmentsComponent implements OnChanges, OnDestroy {
    displayedColumns: string[] = ["plan", "initialStartDate", "changeEffective", "coverageEnd", "coverageAmount"];
    dataSource: any[] = [];
    @Input() enrollment: Enrollment;
    @Input() selectedIndex: number;
    mpGroupId: any;
    memberInfo: any;
    enableNext: boolean;
    isLoading: boolean;
    memberDependents: MemberDependent[];
    memberDependentEnrolls: EnrollmentDependent[];
    member: any;
    currentEnrollment: Enrollment;
    Enrollmentform: FormGroup;
    effectiveDate: any = "";
    errMsg: string;
    errorFlag = false;
    enrollmentStatus = "";
    today = new Date();
    maxDate: Date;
    reasons: any[];
    statusCount = 1;
    formMap = [];
    enrollmentDetailsToSave = [];
    enrollmentIndex: any;
    count = 0;
    disableFalg: boolean;
    maxDateValue = AppSettings.MAX_LENGTH_10;
    stepsCompleted = 1;
    approvedEnrollments: any[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountPendingEnrollments.confirmEnrollment",
        "primary.portal.accountPendingEnrollments.effectiveDate",
        "primary.portal.accountPendingEnrollments.applyThisDate",
        "primary.portal.accountPendingEnrollments.pending",
        "primary.portal.accountPendingEnrollments.current",
        "primary.portal.accountPendingEnrollments.initialStartDate",
        "primary.portal.accountPendingEnrollments.changeEffective",
        "primary.portal.accountPendingEnrollments.coverageEnd",
        "primary.portal.accountPendingEnrollments.coverageAmount",
        "primary.portal.common.back",
        "primary.portal.accountPendingEnrollments.saveAndClose",
        "primary.portal.common.next",
        "primary.portal.accountPendingEnrollment.effectiveEndDate",
        "primary.portal.accountPendingEnrollment.internalServerError",
    ]);
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly pendingEnrollService: PendingEnrollService,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly memberService: MemberService,
        private readonly enrollmentService: EnrollmentService,
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<PendingEnrollmentComponent>,
        private readonly datepipe: DatePipe,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {}

    ngOnChanges(): void {
        this.isLoading = true;

        this.mpGroupId = this.store.selectSnapshot(AccountListState.getGroup);
        if (this.data.memberDetails) {
            this.member = this.data.memberDetails;
        }
        if (this.data.enrollmentData) {
            this.enableNext = true;
            this.enrollmentIndex = this.data.enrollmentData.indexOf(this.enrollment);
            if (this.data.enrollmentData.indexOf(this.enrollment) === this.data.enrollmentData.length - 1) {
                this.enableNext = false;
            }
        }
        if (this.data.enrollmentId) {
            this.enableNext = true;
            this.enrollmentIndex = this.data.enrollmentId.indexOf(this.enrollment);
            if (this.data.enrollmentId.indexOf(this.enrollment) === this.data.enrollmentId.length - 1) {
                this.enableNext = false;
            }
        }
        if (this.selectedIndex === this.stepsCompleted) {
            this.Enrollmentform = this.fb.group({
                effectiveDate: [new Date()],
                enrollmentStatus: [""],
            });
        } else {
            this.Enrollmentform = this.fb.group({
                effectiveDate: [this.enrollmentDetailsToSave[this.selectedIndex - 1].effectiveDate],
                enrollmentStatus: [this.enrollmentDetailsToSave[this.selectedIndex - 1].status],
            });
        }
        const index = this.enrollmentDetailsToSave.findIndex((e) => e.enrollment.id === this.enrollment.id);
        if (index === -1) {
            const enroll = {
                enrollment: this.enrollment,
                effectiveDate: this.datepipe.transform(this.enrollment.changeEffectiveStarting, AppSettings.DATE_FORMAT_YYYY_MM_DD),
                coverageEndDate: "",
                status: null,
            };
            this.enrollmentDetailsToSave[this.selectedIndex - 1] = enroll;
        }
        if (this.enrollment.currentEnrollment) {
            this.getCurrentEnrollmentDetails();
        } else {
            this.getMemberDependentDetails();
        }
    }
    getMemberDependentDetails(): void {
        this.memberDependents = [];
        this.memberService
            .getMemberDependents(this.member.id, false, this.mpGroupId.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (dependents) => {
                    this.memberDependents = dependents;
                },
                () => {},
                () => {
                    this.getMemberDependentEnrollments();
                },
            );
    }
    getMemberDependentEnrollments(): void {
        this.memberDependentEnrolls = [];
        this.enrollmentService
            .getEnrollmentDependents(this.member.id, this.enrollment.id, this.mpGroupId.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (dependentEnrollments) => {
                    this.memberDependentEnrolls = dependentEnrollments;
                },
                () => {
                    this.memberDependentEnrolls = [];
                    this.setDatatoForm();
                },
                () => {
                    this.setDatatoForm();
                },
            );
    }
    setDatatoForm(): void {
        if (this.enrollmentDetailsToSave[this.selectedIndex - 1]) {
            this.enrollment = this.enrollmentDetailsToSave[this.selectedIndex - 1].enrollment;
            this.effectiveDate = this.enrollmentDetailsToSave[this.selectedIndex - 1].effectiveDate;
            this.enrollmentStatus = this.enrollmentDetailsToSave[this.selectedIndex - 1].status;
        }
        this.maxDate = this.dateService.toDate(this.enrollment.validity.expiresAfter);
        this.dataSource = [];
        const accordionData = {
            member: {
                memberName: this.member.name.lastName + " " + this.member.name.firstName,
                type: "Employee",
            },
            data: [
                {
                    effectiveDate: this.datepipe.transform(this.enrollment.changeEffectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    Plan: "true",
                    PlanName: this.enrollment.plan.name,
                    PlanStartDate: this.datepipe.transform(this.enrollment.validity.effectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    PlanEffectiveDate: this.datepipe.transform(this.enrollment.changeEffectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    PlanEndDate: this.datepipe.transform(this.enrollment.validity.expiresAfter, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    PlanCost: this.enrollment.totalCost,
                },
            ],
        };
        let currentEnrollment = false;
        if (this.enrollment.currentEnrollment) {
            currentEnrollment = true;

            accordionData.data.push({
                effectiveDate: this.datepipe.transform(this.currentEnrollment.changeEffectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                Plan: "false",
                PlanName: this.currentEnrollment.plan.name,
                PlanStartDate: this.datepipe.transform(
                    this.currentEnrollment.validity.effectiveStarting,
                    AppSettings.DATE_FORMAT_MM_DD_YYYY,
                ),
                PlanEffectiveDate: this.datepipe.transform(
                    this.currentEnrollment.changeEffectiveStarting,
                    AppSettings.DATE_FORMAT_MM_DD_YYYY,
                ),
                PlanEndDate: this.datepipe.transform(this.currentEnrollment.validity.expiresAfter, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                PlanCost: this.currentEnrollment.totalCost,
            });
        }
        this.dataSource.push(accordionData);
        if (this.memberDependentEnrolls) {
            // If dependents are there then we need to add
            if (this.memberDependentEnrolls.length > 1) {
                this.memberDependentEnrolls.forEach((eachEnroll) => {
                    this.setDependentEnrolls(eachEnroll);
                });
            } else if (this.memberDependentEnrolls.length === 1) {
                this.setDependentEnrolls(this.memberDependentEnrolls[0]);
            }
        }
        this.isLoading = false;
    }

    setDependentEnrolls(memberDependentEnrolls: any): void {
        const dependent = this.memberDependents.filter((eachDependent) => eachDependent.id === memberDependentEnrolls.dependentId);
        if (dependent.length === AppSettings.ONE) {
            let relation;
            if (dependent[0].dependentRelationId === AppSettings.ONE) {
                relation = "Spouse";
            } else if (dependent[0].dependentRelationId === AppSettings.TWO) {
                relation = "Child";
            }
            const DependentaccordionData = {
                member: {
                    memberName: memberDependentEnrolls.name,
                    type: relation,
                },
                data: [
                    {
                        effectiveDate: this.datepipe.transform(this.enrollment.changeEffectiveStarting, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                        Plan: "true",
                        PlanName: this.enrollment.plan.name,
                        PlanStartDate: this.datepipe.transform(
                            memberDependentEnrolls.validity.effectiveStarting,
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        ),
                        PlanEffectiveDate: this.datepipe.transform(
                            this.enrollment.changeEffectiveStarting,
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        ),
                        PlanEndDate: this.datepipe.transform(
                            memberDependentEnrolls.validity.expiresAfter,
                            AppSettings.DATE_FORMAT_MM_DD_YYYY,
                        ),
                        PlanCost: this.enrollment.totalCost,
                    },
                ],
            };
            this.dataSource.push(DependentaccordionData);
        }
    }

    onSave(): void {
        this.enrollmentDetailsToSave[this.selectedIndex - AppSettings.ONE].effectiveDate = this.datepipe.transform(
            this.Enrollmentform.controls.effectiveDate.value,
            AppSettings.DATE_FORMAT_YYYY_MM_DD,
        );
        this.enrollmentDetailsToSave[this.selectedIndex - AppSettings.ONE].status = this.enrollmentStatus;
        this.enrollmentDetailsToSave.forEach((e, index) => {
            if (!e.status) {
                this.enrollmentDetailsToSave.splice(index, 1);
            }
        });
        if (this.enrollmentDetailsToSave.length > 0 || this.Enrollmentform.valid) {
            this.updateCoverageDate(this.enrollmentDetailsToSave);
        } else {
            this.Enrollmentform.controls.effectiveDate.setErrors({ required: true });
        }
    }

    getCurrentEnrollmentDetails(): void {
        this.enrollmentService
            .getEnrollment(this.member.id, this.mpGroupId.id, this.enrollment.currentEnrollment.id, "planId,productId,coverageLevelId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (currentEnrollment) => {
                    this.currentEnrollment = currentEnrollment;
                },
                () => {
                    this.enrollment.currentEnrollment = null;
                    this.getMemberDependentDetails();
                },
                () => {
                    this.getMemberDependentDetails();
                },
            );
    }

    onBack(): void {
        this.pendingEnrollService.nextChange$.next(false);
    }

    onNext(): void {
        const inputDate = this.datepipe.transform(this.Enrollmentform.controls.effectiveDate.value, AppSettings.DATE_FORMAT_YYYY_MM_DD);
        const coverageEnddate = this.enrollment.validity.expiresAfter;
        const date = this.datepipe.transform(new Date(), AppSettings.DATE_FORMAT_YYYY_MM_DD);

        if (
            this.dateService.toDate(inputDate) >= this.dateService.toDate(date) &&
            this.dateService.toDate(inputDate) <= this.dateService.toDate(coverageEnddate)
        ) {
            this.enrollmentDetailsToSave[this.selectedIndex - 1].effectiveDate = inputDate;
            this.enrollmentDetailsToSave[this.selectedIndex - 1].status = this.enrollmentStatus;
            this.pendingEnrollService.nextChange$.next(true);
            if (this.selectedIndex === this.stepsCompleted) {
                this.stepsCompleted++;
            }
        } else {
            this.Enrollmentform.controls.effectiveDate.setErrors({ invalidDate: true });
        }
    }

    changeStatusOfEnrollments(enrollment: any): void {
        const enroll = {
            status: enrollment.status,
            effectiveDate: this.datepipe.transform(enrollment.effectiveDate, AppSettings.DATE_FORMAT_YYYY_MM_DD),
            comment: "",
        };
        this.enrollmentService
            .updateEnrollmentStatus(this.member.id, enrollment.enrollment.id, enroll, this.mpGroupId.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.count++;
                    this.approvedEnrollments.push(enrollment);
                    if (this.count === this.enrollmentDetailsToSave.length) {
                        this.dialogRef.close("save");
                    }
                },
                (error) => {
                    this.errorFlag = true;
                    if (error.status === AppSettings.API_RESP_400 && error.error.details.length) {
                        this.errMsg = error.error.details[0].message;
                    } else if (error.status === AppSettings.API_RESP_500) {
                        this.errMsg = this.languageStrings["primary.portal.accountPendingEnrollment.lifeEvent"];
                    } else {
                        this.errMsg = error.error.details[0].message;
                    }
                },
            );
    }

    onClickAproveOrDeny(): void {
        this.enrollmentStatus = this.Enrollmentform.controls.enrollmentStatus.value;
    }

    updateCoverageDate(EnrollDetails: any[]): any {
        EnrollDetails.forEach((enroll) => {
            const coveraeDetails = {
                enrollment: {
                    coverageLevelId: enroll.enrollment.coverageLevel.id,
                    memberCost: enroll.enrollment.memberCost,
                    totalCost: enroll.enrollment.totalCost,
                    validity: enroll.enrollment.validity,
                    taxStatus: enroll.enrollment.taxStatus,
                    tobaccoStatus: enroll.enrollment.tobaccoStatus,
                },
                reason: this.data.selectedVal.type.description,
                description: "Updating enrollment status",
                effectiveDate: enroll.effectiveDate,
            };
            this.enrollmentService
                .updateCoverage(this.mpGroupId.id, this.member.id, enroll.enrollment.id, coveraeDetails)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.changeStatusOfEnrollments(enroll);
                    },
                    (error) => {
                        this.errorFlag = true;
                        if (error.status === AppSettings.API_RESP_400 && error.error.details.length) {
                            this.errMsg = error.error.details[0].message;
                        } else if (error.status === AppSettings.API_RESP_500) {
                            this.errMsg = this.language.fetchSecondaryLanguageValue(
                                "secondary.portal.accountPendingEnrollments.internalServer",
                            );
                        } else {
                            this.errMsg = this.language.fetchSecondaryLanguageValue(
                                "secondary.portal.accountPendingEnrollments.failedtosave",
                            );
                        }
                    },
                );
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
