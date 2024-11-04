import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { AflacAlwaysActions } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { EnrollAflacAlwaysModalComponent } from "../../enroll-aflac-always-modal/enroll-aflac-always-modal.component";
import { AflacAlwaysHelperService } from "../../enroll-aflac-always-modal/services/aflac-always-helper.service";
import { Router } from "@angular/router";
import { TpiServices } from "@empowered/common-services";

const APP_FLOW = "app-flow";
const TPI_AA_ROUTE = "tpi/aflac-always";

@Component({
    selector: "empowered-learn-more-modal",
    templateUrl: "./learn-more-modal.component.html",
    styleUrls: ["./learn-more-modal.component.scss"],
})
export class LearnMoreModalComponent implements OnInit {
    languageStrings: Record<string, string>;

    constructor(
        @Inject(MAT_DIALOG_DATA)
        readonly memberInfo: {
            mpGroupId: number;
            memberId: number;
            showEnrollmentMethod: boolean;
            isTpi: boolean;
        },
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<LearnMoreModalComponent>,
        private readonly matDialog: MatDialog,
        private readonly ngrxStore: NGRXStore,
        private readonly aflacAlwaysHelperService: AflacAlwaysHelperService,
        private readonly tpiServices: TpiServices,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.fetchLanguageStrings();
    }

    fetchLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.applicationFlow.confirmation.aflacAlwaysCard.learnMoreModal.title",
            "primary.portal.applicationFlow.confirmation.aflacAlwaysCard.learnMoreModal.description",
            "primary.portal.applicationFlow.confirmation.aflacAlwaysCard.learnMoreModal.description.list1",
            "primary.portal.applicationFlow.confirmation.aflacAlwaysCard.learnMoreModal.description.list2",
            "primary.portal.applicationFlow.confirmation.aflacAlwaysCard.learnMoreModal.button",
        ]);
    }

    enrollInAflacAlways(): void {
        this.dialogRef.close();
        if (this.memberInfo.isTpi && !this.tpiServices.isLinkAndLaunchMode()) {
            // setting flag if AA flow from shop page or coverage summary
            if (this.router.url.indexOf(APP_FLOW) >= 0) {
                this.tpiServices.setShopPageFlow(true);
            } else {
                this.tpiServices.setShopPageFlow(false);
            }
            // If `Sign Up` is clicked from TPI Modal Mode redirect TPI Specific AA screen
            this.router.navigate([TPI_AA_ROUTE]);
        } else {
            this.matDialog
                .open(EnrollAflacAlwaysModalComponent, {
                    data: {
                        mpGroupId: this.memberInfo.mpGroupId,
                        memberId: this.memberInfo.memberId,
                        showEnrollmentMethod: this.memberInfo.showEnrollmentMethod,
                    },
                })
                .afterClosed()
                .subscribe(() => {
                    this.aflacAlwaysHelperService.saveAndSubmit$.next(false);
                    // clears modal data on closing aflac always modal
                    this.ngrxStore.dispatch(AflacAlwaysActions.resetAflacAlwaysState());
                });
        }
    }
}
