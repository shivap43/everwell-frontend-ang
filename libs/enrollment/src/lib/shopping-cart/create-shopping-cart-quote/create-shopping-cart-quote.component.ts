import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { EditPlanOrderComponent } from "../edit-plan-order/edit-plan-order.component";
import { ShopCartService, QuoteShopHelperService } from "@empowered/ngxs-store";
import { takeUntil, switchMap } from "rxjs/operators";
import { AppSettings } from "@empowered/constants";
import { DatePipe, CurrencyPipe } from "@angular/common";
import { UserService } from "@empowered/user";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ShoppingService, CoreService, PlanDocument } from "@empowered/api";
import { SafeResourceUrl } from "@angular/platform-browser";
import { Subject } from "rxjs";

const USD = "USD";
const CLOSE = "close";
const EMAIL = "email";
const ALERT = "alert";
const BROCHURE = "BROCHURE";
const INDIVIDUAL_COVERAGE_LEVEL_ID = 1;
const ONE_PARENT_COVERAGE_LEVEL_ID = 2;
const TWO_PARENT_COVERAGE_LEVEL_ID = 3;

interface BrochureDocument {
    planId: number;
    brochure: PlanDocument;
}

@Component({
    selector: "empowered-create-shopping-cart-quote",
    templateUrl: "./create-shopping-cart-quote.component.html",
    styleUrls: ["./create-shopping-cart-quote.component.scss"],
})
export class CreateShoppingCartQuoteComponent implements OnInit, OnDestroy {
    settingsDisplayedColumns: string[] = ["planYear", "enrollmentDate", "coverageDates", "status", "manage"];

    dataSourceObj = {};
    editDialogRef: MatDialogRef<EditPlanOrderComponent>;
    currentDate: Date | string;
    currentTime: Date | string;
    quoteForm: FormGroup;
    riderCost = 0;
    private readonly unsubscribe$ = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.quickQuote.generate",
        "primary.portal.quickQuote.quoteTitle",
        "primary.portal.quickQuote.editPlan",
        "primary.portal.quickQuote.viewQuote",
        "primary.portal.quickQuote.sendQuote",
        "primary.portal.quickQuote.broucher",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.notificationMember.seperator",
        "primary.portal.createQuote.outlineCoverage",
        "primary.portal.createQuote.quoteSubtitle1",
        "primary.portal.createQuote.quoteSubtitle2",
        "primary.portal.createQuote.individual",
        "primary.portal.createQuote.individualAndSpouse",
        "primary.portal.createQuote.oneParentFamily",
        "primary.portal.createQuote.twoParentFamily",
        "primary.portal.common.total",
        "primary.portal.createQuote.basePrice",
        "primary.portal.common.requiredField",
        "primary.portal.createQuote.yourQuickQuote",
        "primary.portal.expandedShoppingCart.employerContribution",
        "primary.portal.tpi.shopReview.benefitAmount",
        "primary.portal.shoppingCart.planOfferings.expansion.eliminationPeriod",
        "primary.portal.quote.separator",
    ]);
    producerName: string;
    quoteTitle = this.languageStrings["primary.portal.createQuote.yourQuickQuote"];
    mpGroup: number;
    memberId: number;
    downloadQuoteURL: string;
    filename = "quoteShop.htm";
    safeUrl: SafeResourceUrl;
    isSpinnerLoading = false;
    planBrochure: BrochureDocument[] = [];
    outlineCoverage = false;
    jobClassValue: string;
    ENROLLED_COVERAGE = 1;

    constructor(
        // planSelection is a cart object that does not have any type, being taken from expanded shopping cart
        @Inject(MAT_DIALOG_DATA) readonly planSelection: any,
        private readonly language: LanguageService,
        private readonly dialog: MatDialog,
        private readonly dialogRef: MatDialogRef<CreateShoppingCartQuoteComponent>,
        private readonly shopCartService: ShopCartService,
        private readonly datePipe: DatePipe,
        private readonly userService: UserService,
        private readonly currencyPipe: CurrencyPipe,
        private readonly fb: FormBuilder,
        private readonly shoppingService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
    ) {}

    /**
     *@description Angular life cycle hook
     *
     * @memberof CreateShoppingCartQuoteComponent
     */
    ngOnInit(): void {
        this.isSpinnerLoading = true;
        const planIds: number[] = [];
        this.getCurrentDate();
        this.getProducerName();
        this.initializeQuoteForm();
        this.memberId = this.planSelection.memberId;
        this.mpGroup = this.planSelection.mpGroup;
        this.shopCartService.planOrderCreateQuote.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.planSelection.planSelection = data;
        });
        this.planSelection.planSelection.forEach((plan) => {
            this.coreService
                .getCoverageLevels(plan.planId)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.isSpinnerLoading = false;
                        plan = { ...plan, coverageLevel: resp };
                        this.generateDataSource(plan);
                    },
                    () => {
                        this.isSpinnerLoading = false;
                    },
                );

            planIds.push(plan.planId);
        });
        this.getPlanDetails(planIds);
        this.quoteShopHelperService.currentSelectedJobClass.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.jobClassValue = resp.name;
        });
    }
    /**
     *
     *@description function to initialize the form and set requirements
     * @memberof CreateShoppingCartQuoteComponent
     */
    initializeQuoteForm(): void {
        this.quoteForm = this.fb.group({
            quoteName: [[this.quoteTitle], Validators.required],
        });
    }

    /**
     *
     *@description function for service call to get the plan related documents for each plan in cart
     * @param planIds collection of plan Id
     * @returns void
     * @memberof CreateShoppingCartQuoteComponent
     */
    getPlanDetails(planIds: number[]): void {
        this.coreService
            .getPlanDocuments(planIds, this.planSelection.state, this.planSelection.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                resp.forEach((planDocument) => {
                    this.planBrochure.push({ planId: planDocument.planId, brochure: planDocument });
                });
            });
    }

    /**
     *
     *@description function to display brochure link only when it is available
     * @param {number} planId
     * @returns {boolean}
     * @memberof CreateShoppingCartQuoteComponent
     */
    showPlanDetails(planId: number): boolean {
        return Boolean(this.planBrochure.find((planDocument) => planDocument.planId === planId && planDocument.brochure.type === BROCHURE));
    }
    /**
     *
     *@description function to open the selected plans brochure/document in next tab
     * @param {number} planId
     * @memberof CreateShoppingCartQuoteComponent
     */
    openBrochure(planId: number): void {
        const link = this.planBrochure.find((planDocument) => planDocument.planId === planId);
        window.open(link.brochure.location, "_blank");
    }

    /**
     *
     *@description function to update the quote title
     * @memberof CreateShoppingCartQuoteComponent
     */
    updateTitle(): void {
        this.quoteTitle = this.quoteForm.value.quoteName;
    }
    /**
     * @description generate the cost of a plan or rider
     * @param item : as plan selection does not have any type
     * @returns {string} the transformed amount string
     */
    generateCost(item: any): string {
        return this.currencyPipe.transform(item.cost ? item.cost : item.totalCost, USD);
    }
    /**
     * @description function to generate the table for each plan selected
     * @param item : as plan selection does not have any type
     * @memberof CreateShoppingCartQuoteComponent
     */
    generateDataSource(item: any): void {
        const key = item.id;
        this.dataSourceObj[key] = [];
        const cost = this.currencyPipe.transform(item.baseCost, USD);
        if (item.coverageLevel.some((coverage) => coverage.name.includes("Days"))) {
            item.coverageLevel = [{ id: item.coverageLevelId, name: this.languageStrings["primary.portal.createQuote.individual"] }];
        }

        this.dataSourceObj[key].push({
            name: this.languageStrings["primary.portal.createQuote.basePrice"],
            coverageName: item.coverageLevel,
            coverageIndividual: item.coverageLevel[0] && item.coverageLevel[0].id === item.coverageLevelId ? cost : "",
            coverageIndividualPlus:
                item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID] &&
                item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                    ? cost
                    : "",
            coverageOneParent:
                item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID] &&
                item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                    ? cost
                    : "",
            coverageTwoParent:
                item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID] &&
                item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                    ? cost
                    : "",
        });
        item.riders.forEach((rider, i) => {
            const riderCost = this.generateCost(rider);
            this.riderCost = this.riderCost + rider.cost;
            this.dataSourceObj[key].push({
                name: item.riderName[i],
                benefitAmount: item.riders[i].benefitAmount,
                coverageName: item.coverageLevel,
                coverageIndividual: item.coverageLevel[0] && item.coverageLevel[0].id === item.coverageLevelId ? riderCost : "",
                coverageIndividualPlus:
                    item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID] &&
                    item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                        ? riderCost
                        : "",
                coverageOneParent:
                    item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID] &&
                    item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                        ? riderCost
                        : "",
                coverageTwoParent:
                    item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID] &&
                    item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                        ? riderCost
                        : "",
            });
        });
        if (item.flexDollars && item.flexDollars.length) {
            item.flexDollars.forEach((flexDollar) => {
                const bdCost: string = this.currencyPipe.transform(flexDollar.flexDollarOrIncentiveAmount, USD);
                this.dataSourceObj[key].push({
                    name: this.languageStrings["primary.portal.expandedShoppingCart.employerContribution"],
                    coverageName: item.coverageLevel,
                    coverageIndividual: item.coverageLevel[0] && item.coverageLevel[0].id === item.coverageLevelId ? bdCost : "",
                    coverageIndividualPlus:
                        item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID] &&
                        item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                            ? bdCost
                            : "",
                    coverageOneParent:
                        item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID] &&
                        item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                            ? bdCost
                            : "",
                    coverageTwoParent:
                        item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID] &&
                        item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                            ? bdCost
                            : "",
                });
            });
        }
        const memberCost = this.currencyPipe.transform(item.memberCost, USD);
        this.dataSourceObj[key].push({
            name: this.languageStrings["primary.portal.common.total"],
            coverageName: item.coverageLevel,
            coverageIndividual: item.coverageLevel[0] && item.coverageLevel[0].id === item.coverageLevelId ? memberCost : "",
            coverageIndividualPlus:
                item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID] &&
                item.coverageLevel[INDIVIDUAL_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                    ? memberCost
                    : "",
            coverageOneParent:
                item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID] &&
                item.coverageLevel[ONE_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                    ? memberCost
                    : "",
            coverageTwoParent:
                item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID] &&
                item.coverageLevel[TWO_PARENT_COVERAGE_LEVEL_ID].id === item.coverageLevelId
                    ? memberCost
                    : "",
        });
    }
    /**
     *
     *@description function to set today's date
     * @memberof CreateShoppingCartQuoteComponent
     */
    getCurrentDate(): void {
        this.currentTime = new Date();
        this.currentDate = this.datePipe.transform(this.currentTime, AppSettings.DATE_FORMAT_MM_DD_YYYY);
    }
    /**
     *
     *@description function to fetch producer name to display on quote
     * @memberof CreateShoppingCartQuoteComponent
     */
    getProducerName(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            if ("producerId" in credential) {
                if (credential.name.middleName) {
                    this.producerName = credential.name.firstName + " " + credential.name.middleName + " " + credential.name.lastName;
                } else {
                    this.producerName = credential.name.firstName + " " + credential.name.lastName;
                }
            }
        });
    }

    /**
     *
     *@description function to arrange date in mm/dd/yyyy format
     * @param {Date} date
     * @returns {string}
     * @memberof CreateShoppingCartQuoteComponent
     */
    formatDate(date: Date): string {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
    }

    /**
     *
     *@description function to close current open dialog box
     * @memberof CreateShoppingCartQuoteComponent
     */
    closeForm(): void {
        this.dialogRef.close();
    }
    /**
     *
     *@description function to open dialog box to rearrange the order of plans
     * @memberof CreateShoppingCartQuoteComponent
     */
    openEditOrderDialog(): void {
        this.dialog.open(EditPlanOrderComponent, {
            maxWidth: "667px",
            data: {
                planSelection: this.planSelection.planSelection,
                type: "edit",
                memberId: this.memberId,
                mpGroup: this.mpGroup,
            },
        });
    }
    /**
     *
     *@description function to open the pdf of member's quote with present display order in new tab
     * @memberof CreateShoppingCartQuoteComponent
     */
    downloadCartQuote(): void {
        if (this.quoteForm.valid) {
            this.isSpinnerLoading = true;
            const itemOrder = [];
            this.planSelection.planSelection.forEach((plan, i: number) => {
                itemOrder.push({ cartItemId: plan.id, displayOrder: i + 1 });
            });
            this.shoppingService
                .assignDisplayOrderToCartItems(this.memberId, this.mpGroup, itemOrder)
                .pipe(switchMap((resp) => this.shoppingService.downloadShoppingCartQuote(this.memberId, this.quoteTitle, this.mpGroup)))
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.isSpinnerLoading = false;
                        const unSignedBlob = new Blob([response], { type: "application/pdf" });
                        this.downloadQuoteURL = window.URL.createObjectURL(unSignedBlob);
                        window.open(this.downloadQuoteURL);

                        /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                        if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
                            (window.navigator as any).msSaveOrOpenBlob(unSignedBlob, this.filename);
                        }
                    },
                    (err) => {
                        this.isSpinnerLoading = false;
                    },
                );
        } else {
            this.quoteForm.controls.quoteName.markAsTouched();
        }
    }
    /**
     *
     *@description function to open the email dialog box
     * @memberof CreateShoppingCartQuoteComponent
     */
    emailCartQuote(): void {
        if (this.quoteForm.valid) {
            this.editDialogRef = this.dialog.open(EditPlanOrderComponent, {
                maxWidth: "500px",
                data: {
                    type: EMAIL,
                    memberId: this.memberId,
                    mpGroup: this.mpGroup,
                    quoteTitle: this.quoteTitle,
                },
            });
        } else {
            this.quoteForm.controls.quoteName.markAsTouched();
        }

        this.editDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((afterClose) => {
                if (afterClose.action === CLOSE) {
                    this.dialogRef.close({ type: ALERT });
                }
            });
    }
    /**
     *@description Angular life cycle hook
     *
     * @memberof CreateShoppingCartQuoteComponent
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
