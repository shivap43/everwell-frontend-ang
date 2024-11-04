import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { moveItemInArray, CdkDragDrop } from "@angular/cdk/drag-drop";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";

import { UniversalService } from "../universal.service";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { AflacService, PlanSelections, QuoteSettings } from "@empowered/api";
import { Subject, Observable } from "rxjs";
import { takeUntil, finalize } from "rxjs/operators";
import { Select } from "@ngxs/store";
import { SharedState, RegexDataType, UtilService } from "@empowered/ngxs-store";

const EDIT = "edit";
const EMAIL = "email";
const CLOSE = "close";
const EMAIL_NAME = "emailName";

@Component({
    selector: "empowered-edit-plan-details",
    templateUrl: "./edit-plan-details.component.html",
    styleUrls: ["./edit-plan-details.component.scss"],
})
export class EditPlanDetailsComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    private readonly unsubscribe$ = new Subject<void>();
    plans: any;
    edit = EDIT;
    emailType = EMAIL;
    emailForm: FormGroup;
    email: string;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    validationRegex: RegexDataType;
    notes: string;
    isLoading = false;
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly planSelection: any,
        private readonly language: LanguageService,
        private readonly matDialog: MatDialogRef<EditPlanDetailsComponent>,
        private readonly utilService: UtilService,
        private readonly universalService: UniversalService,
        private readonly fb: FormBuilder,
        private readonly aflacService: AflacService,
    ) {}
    /**
     * Initializing language,fetching validation and creates form for email quote
     * @memberof EditPlanDetailsComponent
     */
    ngOnInit(): void {
        this.initializeLanguageStrings();
        /* regex validation from DB */
        this.regex$.subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.plans = this.utilService.copy(this.planSelection);
        /* included form group for email quote*/
        if (this.planSelection.type === this.emailType) {
            this.emailForm = this.fb.group({
                emailName: ["", [Validators.required, Validators.pattern(this.validationRegex.EMAIL)]],
                note: [""],
            });
        }
    }
    onDrop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.plans.planSelection, event.previousIndex, event.currentIndex);
    }
    /**
     * function to fetch primary languages
     * @memberof EditPlanDetailsComponent
     */
    initializeLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.quickQuote.planName",
            "primary.portal.quickQuote.editOrder",
            "primary.portal.common.close",
            "primary.portal.common.optional",
            "primary.portal.createQuote.notes",
            "primary.portal.quickQuote.email",
            "primary.portal.quickQuote.sendQuote",
            "primary.portal.common.requiredField",
            "primary.portal.common.save",
            "primary.portal.common.cancel",
            "primary.portal.createQuote.send",
            "primary.portal.editPlanDetails.validEmailError",
        ]);
    }
    updatePlanOrder(): void {
        this.universalService.planOrderUpdated$.next(this.plans.planSelection);
        this.closeDialog();
    }
    closeDialog(): void {
        this.matDialog.close();
    }

    /**
     * function to extract the email entered by user in text box
     * @memberof EditPlanDetailsComponent
     */
    updateEmail(): void {
        this.email = this.emailForm.value.emailName;
    }

    /**
     * function to extract the notes entered by user in text box
     * @memberof EditPlanDetailsComponent
     */
    sendNote(): void {
        this.notes = this.emailForm.value.note;
    }

    /**
     * function to send quote for the selected plans to member or producer via email
     * @memberof EditPlanDetailsComponent
     */
    onSubmit(emailForm: FormGroup): void {
        if (emailForm.valid) {
            this.isLoading = true;
            const emailDetails = {
                quoteTitle: this.plans.quoteTitle,
                email: this.email,
                notes: this.notes,
                planSelections: this.plans.planSelections as PlanSelections[],
                quoteSettings: this.plans.quoteSettings as QuoteSettings,
                partnerAccountType: this.plans.partnerAccountType,
            };
            this.aflacService
                .emailQuickQuote(emailDetails)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    finalize(() => {
                        this.isLoading = false;
                        this.matDialog.close({ action: CLOSE });
                    }),
                )
                .subscribe();
        }
    }
    /**
     * Unsubscribe the subscriptions to avoid memory leaks
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
