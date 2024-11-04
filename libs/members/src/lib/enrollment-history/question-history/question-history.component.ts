import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { EnrollmentService, UnderwritingQuestions, AuditEnrollment } from "@empowered/api";
import { Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

// TODO: Remove static data
const ELEMENT_DATA: UnderwritingQuestions[] = [
    {
        question: "Is your Spouse, if applying for coverage, actively at work?",
        answer: "No",
    },
    {
        question: "Is this insurance intended to replace any other health insurance now in force?",
        answer: "Yes",
    },
];

@Component({
    selector: "empowered-question-history",
    templateUrl: "./question-history.component.html",
    styleUrls: ["./question-history.component.scss"],
})
export class QuestionHistoryComponent implements OnInit, OnDestroy {
    @Input() enrollment: AuditEnrollment;
    mpGroup: number;
    memberId: number;
    isLoading: boolean;
    underwritingQuestions: UnderwritingQuestions[];
    subscription: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.activityHistory.underQues",
        "primary.portal.activityHistory.updateFirstLast",
        "primary.portal.activityHistory.questions",
        "primary.portal.activityHistory.answers",
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
        this.getEnrollmentUnderwritingQuestions();
    }

    /**
     * Gets enrollment underwriting questions
     */
    getEnrollmentUnderwritingQuestions(): void {
        this.subscription.push(
            this.enrollmentsService
                .getEnrollmentUnderwritingQuestions(this.memberId, this.enrollment.auditedEnrollment.id, this.mpGroup)
                .subscribe(
                    (data) => {
                        this.underwritingQuestions = data;
                        this.enrollment.auditedEnrollment.displayQuestionHistory = !(
                            this.underwritingQuestions && this.underwritingQuestions.length
                        );
                        this.isLoading = false;
                    },
                    (err) => {
                        // TODO: Remove static data assignement once get API response
                        this.underwritingQuestions = ELEMENT_DATA;
                        this.enrollment.auditedEnrollment.displayQuestionHistory = !(
                            this.underwritingQuestions && this.underwritingQuestions.length
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
