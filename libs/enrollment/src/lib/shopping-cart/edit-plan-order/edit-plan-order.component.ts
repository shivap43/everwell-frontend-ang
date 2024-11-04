import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { moveItemInArray, CdkDragDrop } from "@angular/cdk/drag-drop";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { ShopCartService, SetErrorForShop, UtilService } from "@empowered/ngxs-store";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ShoppingService, MemberService, CartDisplayOrder } from "@empowered/api";
import { MemberContact } from "@empowered/constants";
import { RegexForFieldValidation } from "@empowered/ui";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { Store } from "@ngxs/store";

const EDIT = "edit";
const EMAIL = "email";
const CLOSE = "close";

@Component({
    selector: "empowered-edit-plan-order",
    templateUrl: "./edit-plan-order.component.html",
    styleUrls: ["./edit-plan-order.component.scss"],
})
export class EditPlanOrderComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    plans: any;
    emailForm: FormGroup;
    email: string;
    EMAIL_REGEX = new RegExp(RegexForFieldValidation.EMAIL);
    notes: string;
    edit = EDIT;
    emailType = EMAIL;
    itemOrder: CartDisplayOrder[] = [];
    isLoading = false;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly matDialog: MatDialogRef<EditPlanOrderComponent>,
        private readonly utilService: UtilService,
        private readonly shopCartService: ShopCartService,
        private readonly fb: FormBuilder,
        private readonly shoppingService: ShoppingService,
        private readonly memberService: MemberService,
    ) {}

    /**
     * @description Angular Life cycle hook
     *
     * @memberof EditPlanOrderComponent
     */
    ngOnInit(): void {
        this.initializeLanguageStrings();
        this.plans = this.utilService.copy(this.data);
        if (this.data.type === this.emailType) {
            this.initializeEmailForm();
            this.memberService
                .getMemberContact(this.data.memberId, "HOME", this.data.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.email = resp.body.emailAddresses[0].email;
                        this.editForm(resp.body);
                    },
                    (error) => {
                        if (error.error) {
                            this.store.dispatch(new SetErrorForShop(error.error));
                        }
                        this.isLoading = false;
                    },
                );
        }
    }

    /**
     *
     *@description function to perform drag and drop to customize the plan order
     * @param {CdkDragDrop<string[]>} event
     * @memberof EditPlanOrderComponent
     */
    onDrop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.plans.planSelection, event.previousIndex, event.currentIndex);
    }

    /**
     *
     *@description function to initialize language strings
     * @memberof EditPlanOrderComponent
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
            "primary.portal.createQuote.dragDropPlans",
        ]);
    }
    /**
     *
     *@description function to rearrange the plan order set by user
     * @memberof EditPlanOrderComponent
     */
    updatePlanOrder(): void {
        this.shopCartService.reorderPlan(this.plans.planSelection);
        this.matDialog.close();
    }

    /**
     *
     *@description function to initialize the form and set required regex
     * @memberof EditPlanOrderComponent
     */
    initializeEmailForm(): void {
        this.emailForm = this.fb.group({
            emailName: ["", [Validators.required, Validators.pattern(this.EMAIL_REGEX)]],
            note: [""],
        });
    }
    /**
     *
     *@description pre-populate the email input field in dialog box
     * @param {MemberContact} resp
     * @memberof EditPlanOrderComponent
     */
    editForm(resp: MemberContact): void {
        this.emailForm.patchValue({
            emailName: resp.emailAddresses[0].email,
        });
    }

    /**
     *
     *@description function to extract the email entered by user in textbox
     * @memberof EditPlanOrderComponent
     */
    updateEmail(): void {
        this.email = this.emailForm.value.emailName;
    }

    /**
     *
     *@description function to extract the notes entered by user in textbox
     * @memberof EditPlanOrderComponent
     */
    sendNote(): void {
        this.notes = this.emailForm.value.note;
    }

    /**
     *@description function to send quote for the selected plans to member via email
     * @memberof EditPlanOrderComponent
     */
    emailQuote(): void {
        if (this.emailForm.valid) {
            this.isLoading = true;
            this.shoppingService
                .emailShoppingCartQuote(
                    this.data.memberId,
                    this.data.mpGroup,
                    this.data.quoteTitle,
                    this.email,
                    this.notes ? this.notes : null,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.isLoading = false;
                        this.matDialog.close({ action: CLOSE });
                    },
                    (error: HttpErrorResponse) => {
                        this.isLoading = false;
                    },
                );
        }
    }
    /**
     *
     *@description function to close the dialog box
     * @memberof EditPlanOrderComponent
     */
    closeDialog(): void {
        this.matDialog.close();
    }

    /**
     *@description Angular life cycle hook
     *
     * @memberof EditPlanOrderComponent
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
