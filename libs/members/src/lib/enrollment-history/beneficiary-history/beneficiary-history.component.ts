import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { EnrollmentService, AuditEnrollment } from "@empowered/api";
import { EnrollmentBeneficiary } from "@empowered/constants";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-beneficiary-history",
    templateUrl: "./beneficiary-history.component.html",
    styleUrls: ["./beneficiary-history.component.scss"],
})
export class BeneficiaryHistoryComponent implements OnInit, OnDestroy {
    @Input() enrollment: AuditEnrollment;

    mpGroup: number;
    memberId: number;
    isLoading: boolean;
    enrollmentBeneficiary: EnrollmentBeneficiary[];
    beneficiaryColumns: string[] = ["Name", "Designation", "Type", "Allocation"];
    subscription: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.activityHistory.beneficiary",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.name",
        "primary.portal.activityHistory.designation",
        "primary.portal.activityHistory.type",
        "primary.portal.activityHistory.allocation",
        "primary.portal.coverage.beneficiary.myEstate",
        "primary.portal.coverage.estate",
    ]);
    myEstate = this.languageStrings["primary.portal.coverage.beneficiary.myEstate"];
    // Default Estate Beneficiary
    ESTATE_BENEFICIARY: EnrollmentBeneficiary[] = [
        {
            beneficiary: {
                type: this.languageStrings["primary.portal.coverage.estate"],
                details: null,
                contact: null,
                name: {
                    firstName: this.myEstate.split(" ")[0],
                    lastName: this.myEstate.split(" ")[1],
                },
                allocations: null,
            },
            allocationType: null,
            percent: null,
        },
    ];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly enrollmentsService: EnrollmentService,
        private readonly language: LanguageService,
    ) {}

    ngOnInit(): void {
        this.isLoading = true;
        this.subscription.push(
            this.route.parent.parent.params.subscribe((params) => {
                this.mpGroup = +params["mpGroupId"];
                this.memberId = +params["memberId"];
            }),
        );
        this.getEnrollmentBeneficiaries();
    }
    /**
     * gets enrollment beneficiaries
     */
    getEnrollmentBeneficiaries(): void {
        this.subscription.push(
            this.enrollmentsService.getEnrollmentBeneficiaries(this.memberId, this.enrollment.auditedEnrollment.id, this.mpGroup).subscribe(
                (data) => {
                    this.enrollmentBeneficiary = data.length <= 0 ? this.ESTATE_BENEFICIARY : data;
                    this.isLoading = false;
                },
                (err) => {
                    // TODO: Remove static data assignement once get API response
                    this.enrollmentBeneficiary = this.ESTATE_BENEFICIARY;
                    this.isLoading = false;
                },
            ),
        );
    }

    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
