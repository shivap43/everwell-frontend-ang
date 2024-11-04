import { Component, OnInit, Inject, ViewChild, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { MemberService, Enrollment } from "@empowered/api";
import { StatusType } from "@empowered/constants";
import { PendingEnrollService } from "./services/pending-enroll.service";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { MonDialogComponent } from "@empowered/ui";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-pending-enrollment",
    templateUrl: "./pending-enrollment.component.html",
    styleUrls: ["./pending-enrollment.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class PendingEnrollmentComponent implements OnInit, OnDestroy {
    step = 0;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.qle.pendingEnrollment.title",
        "primary.portal.common.cancel",
    ]);
    currentStep: number;
    enrollment: Enrollment;
    completedStep: number;
    @ViewChild("progressIndicator") progressIndicator;
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    enrollmentData: Enrollment[] = [];
    display = true;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly dialogRef: MatDialogRef<PendingEnrollmentComponent>,
        private readonly memberService: MemberService,
        private readonly pendingEnrollService: PendingEnrollService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
    ) {}

    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.accountPendingEnrollments.*"));
        if (!this.data.editLifeEvent) {
            if (this.data.enrollmentId) {
                this.enrollmentData = this.data.enrollmentId.filter((ele) => ele.status === StatusType.PENDING);
            } else if (this.data.enrollmentData) {
                this.enrollmentData = this.data.enrollmentData.filter((ele) => ele.status === StatusType.PENDING);
            }
            this.pendingEnrollService.staticStepDone$.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
                this.completedStep = 1;
                this.progressIndicator.linear = false;
                this.progressIndicator.selectedIndex = 1;
                this.progressIndicator.linear = true;
            });
            this.pendingEnrollService.nextChange$.pipe(takeUntil(this.unsubscribe$)).subscribe((nextClicked) => {
                if (nextClicked && this.step === this.completedStep) {
                    this.completedStep += 1;
                    this.progressIndicator.linear = false;
                    this.progressIndicator.selectedIndex += 1;
                    this.progressIndicator.linear = true;
                } else if (!nextClicked) {
                    this.progressIndicator.selectedIndex -= 1;
                } else {
                    this.progressIndicator.linear = false;
                    this.progressIndicator.selectedIndex += 1;
                    this.progressIndicator.linear = true;
                }
            });
        }
    }

    closeForm(): void {
        this.alertModal();
    }

    alertModal(): void {
        this.alertDialogRef = this.dialog.open(MonDialogComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                // TODO  Static values will be removed once language is implemented
                title: "Are you sure you want to close?",
                content: "Your changes have not been saved and will be lost",
                primaryButton: {
                    buttonTitle: "Close",
                    buttonClass: "mon-btn-primary",
                    buttonAction: this.alert.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: "Cancel",
                    buttonAction: this.alert.bind(this, false),
                },
            },
        });
    }

    alert(flag: boolean): void {
        if (flag) {
            this.dialogRef.close();
            this.memberService.updateQLEList(false);
        }
    }

    onSelectionChange(event: any): void {
        this.step = event.selectedIndex;
        if (event.selectedIndex >= 1) {
            this.enrollment = this.enrollmentData[event.selectedIndex - 1];
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
