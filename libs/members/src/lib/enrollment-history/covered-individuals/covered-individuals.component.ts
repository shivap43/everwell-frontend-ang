import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { EnrollmentService, AuditEnrollment } from "@empowered/api";
import { AppSettings, EnrollmentDependent } from "@empowered/constants";
import { Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

// TODO: Remove static data
const ELEMENT_DATA: EnrollmentDependent[] = [
    {
        dependentId: 1,
        name: "name 1",
        validity: {
            effectiveStarting: "2018-11-04",
            expiresAfter: "2018-11-04",
        },
    },
    {
        dependentId: 2,
        name: "name 2",
        validity: {
            effectiveStarting: "2019-11-04",
            expiresAfter: "2019-11-04",
        },
    },
];
@Component({
    selector: "empowered-covered-individuals",
    templateUrl: "./covered-individuals.component.html",
    styleUrls: ["./covered-individuals.component.scss"],
})
export class CoveredIndividualsComponent implements OnInit, OnDestroy {
    @Input() enrollment: AuditEnrollment;
    mpGroup: number;
    memberId: number;
    isLoading: boolean;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    enrollmentDependent: EnrollmentDependent[];
    displayedColumns: string[] = ["Name", "Coveragedate"];
    subscription: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.activityHistory.coveredIndividuals",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.name",
        "primary.portal.activityHistory.coverageDate",
    ]);

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
        this.getEnrollmentDependents();
    }
    /**
     * gets enrollment dependents
     */
    getEnrollmentDependents(): void {
        this.subscription.push(
            this.enrollmentsService.getEnrollmentDependents(this.memberId, this.enrollment.auditedEnrollment.id, this.mpGroup).subscribe(
                (data) => {
                    this.enrollmentDependent = data;
                    this.enrollment.auditedEnrollment.displayCoveredIndividuals = !(
                        this.enrollmentDependent && this.enrollmentDependent.length
                    );
                    this.isLoading = false;
                },
                (err) => {
                    // TODO: Remove static data assignement once get API response
                    this.enrollmentDependent = ELEMENT_DATA;
                    this.enrollment.auditedEnrollment.displayCoveredIndividuals = !(
                        this.enrollmentDependent && this.enrollmentDependent.length
                    );
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
