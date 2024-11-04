import { ReviewFlowService, StepTitle } from "../services/review-flow.service";
import { Component, OnInit, Input, OnDestroy, HostListener } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MemberService, PdaForm, StaticService } from "@empowered/api";
import { SafeResourceUrl, DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { Subject, Observable } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { SharedState } from "@empowered/ngxs-store";
import { Select } from "@ngxs/store";

@Component({
    selector: "empowered-pda-review",
    templateUrl: "./pda-review.component.html",
    styleUrls: ["./pda-review.component.scss"],
})
export class PdaReviewComponent implements OnInit, OnDestroy {
    private unsubscribe$ = new Subject<void>();
    unSignedData: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.review.acknowledgetype",
        "primary.portal.enrollment.review.acknowledge",
        "primary.portal.enrollment.review.agent",
        "primary.portal.enrollment.review.agree",
        "primary.portal.enrollment.review.anotherdocument",
        "primary.portal.enrollment.review.application",
        "primary.portal.enrollment.review.approvepda",
        "primary.portal.enrollment.review.birthdate",
        "primary.portal.enrollment.review.business",
        "primary.portal.enrollment.review.byemailat",
        "primary.portal.enrollment.review.calling",
        "primary.portal.common.close",
        "primary.portal.enrollment.review.complete",
        "primary.portal.enrollment.review.completebtn",
        "primary.portal.enrollment.review.confirmation",
        "primary.portal.enrollment.review.confirmidentiy",
        "primary.portal.enrollment.review.consent",
        "primary.portal.enrollment.review.document",
        "primary.portal.enrollment.review.e-signaturev",
        "primary.portal.enrollment.review.edit",
        "primary.portal.enrollment.review.email",
        "primary.portal.enrollment.review.enrollment",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.enrollment.review.firstname",
        "primary.portal.enrollment.review.initial",
        "primary.portal.enrollment.review.lastname",
        "primary.portal.enrollment.review.monthly",
        "primary.portal.common.next",
        "primary.portal.enrollment.review.payroll",
        "primary.portal.enrollment.review.question",
        "primary.portal.enrollment.review.reject",
        "primary.portal.enrollment.review.review",
        "primary.portal.enrollment.review.reviewandsign",
        "primary.portal.enrollment.review.reviewcomplete",
        "primary.portal.enrollment.review.reviewinfo",
        "primary.portal.enrollment.review.reviewpda",
        "primary.portal.enrollment.review.reviewplan",
        "primary.portal.enrollment.review.signature",
        "primary.portal.enrollment.review.esignature",
        "primary.portal.enrollment.review.signaturefinish",
        "primary.portal.enrollment.review.signout",
        "primary.portal.enrollment.review.submittedsignature",
        "primary.portal.enrollment.review.summary",
        "primary.portal.common.submit",
        "primary.portal.enrollment.review.verify",
        "primary.portal.enrollment.review.verifyidentity",
        "primary.portal.enrollment.review.yourtotalcost",
        "primary.portal.pda.form.viewunsignedpda",
        "primary.portal.pda.form.pdaTitle",
        "primary.portal.coverage.taxstatu",
        "primary.portal.coverage.coveredindividuals",
        "primary.portal.shoppingExperience.eliminationPeriod",
        "primary.portal.productExceptions.planName",
        "primary.portal.createReportForm.pda",
        "primary.portal.review.signature.required",
        "primary.portal.review.reviewSignature",
        "primary.portal.review.technicalHelp",
        "primary.portal.common.submit",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.review.downloadErrorMsg",
        "secondary.portal.review.signingErrorMsg",
    ]);
    thirdFormGroup: any;

    memberId: number;
    mpGroup: number;
    groupId: any;

    unSignedFileURL: string;
    safeUrl: SafeResourceUrl;
    dialogRef;

    validationRegex: any;
    esignature: any;
    signature: any;
    isSpinnerLoading = false;
    saveError = false;
    errorMessage: any;
    customerSign: string;
    pdaForm: PdaForm;
    @Input() formType: string;
    @Input() formId: number;
    @Input() userDetails: any;
    @Select(SharedState.regex) regex$: Observable<any>;

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly sanitizer: DomSanitizer,
        private readonly route: ActivatedRoute,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly staticService: StaticService,
    ) {}

    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.thirdFormGroup = this._formBuilder.group({ signature: [""] });
        this.getConfigurationSpecifications();
        this.getRegex();
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.memberId = params["memberId"];
            this.groupId = params["groupId"];
        });

        this.memberId = this.userDetails.memberId;
        this.mpGroup = this.userDetails.groupId;
        this.getForm();
    }

    getRegex(): void {
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe(
            (data) => {
                this.isSpinnerLoading = true;
                if (data) {
                    this.validationRegex = data.E_SIGNATURE;
                    this.thirdFormGroup = this._formBuilder.group(
                        {
                            signature: [
                                "",
                                [Validators.required, Validators.pattern(new RegExp(this.validationRegex)), Validators.minLength(2)],
                            ],
                        },
                        { updateOn: "blur" },
                    );
                }
            },
            (error) => {
                this.isSpinnerLoading = false;
            },
        );
    }
    /**
     * Get PDA form of particular member
     */
    getForm(): void {
        this.memberService
            .downloadMemberForm(this.memberId, this.formType, this.formId, this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    this.isSpinnerLoading = false;
                    this.unSignedData = data;
                },
                (error) => {
                    this.saveError = true;
                    this.isSpinnerLoading = false;
                    this.errorMessage = this.languageSecondStringsArray["secondary.portal.review.downloadErrorMsg"];
                },
            );
    }

    hasError = (controlName: string, errorName: string) => {
        return this.thirdFormGroup.controls["signature"].hasError(errorName);
    };
    /**
     * Open pdf in new tab
     */
    openPDF(): void {
        const unSignedBlob = new Blob([this.unSignedData], {
            type: "text/html",
        });
        this.unSignedFileURL = window.URL.createObjectURL(unSignedBlob);

        /*
        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
        Typescript won't know this is a thing, so we have to use Type Assertion
        */
        if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
            (window.navigator as any).msSaveOrOpenBlob(unSignedBlob);
        } else {
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.unSignedFileURL);
            window.open(this.unSignedFileURL, "_blank");
        }
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    /**
     * On submission this will call a post request for members.
     */
    onSubmit(): void {
        this.isSpinnerLoading = true;
        const payload = {
            signature: this.esignature,
        };

        this.memberService
            .signMemberForm(this.memberId, this.formType, this.formId, payload, this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.isSpinnerLoading = false;
                    this.reviewFlowService.stepChanged$.next(StepTitle.PDA);
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    this.saveError = true;
                    this.errorMessage = this.languageSecondStringsArray["secondary.portal.review.signingErrorMsg"];
                },
            );
    }

    getConfigurationSpecifications(): void {
        this.staticService.getConfigurations("user.enrollment.telephone_signature_placeholder", this.mpGroup).subscribe((data) => {
            this.customerSign = data[0].value.split(",")[0];
        });
    }

    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event: any): boolean {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
