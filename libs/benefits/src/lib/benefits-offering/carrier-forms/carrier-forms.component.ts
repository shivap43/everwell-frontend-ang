import {
    CarrierFormWithCarrierInfo,
    AflacService,
    AccountProfileService,
    CarrierFormSetupStatus,
    AccountService,
    AccountDetails,
    ApplicationStatusTypes,
} from "@empowered/api";
import { EmpoweredModalService } from "@empowered/common-services";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Observable, of, Subject } from "rxjs";
import { take, catchError, first, filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { BenefitsOfferingState, SetUnapprovedPlanChoices, SideNavService, AccountInfoState } from "@empowered/ngxs-store";
import { ViewFormComponent } from "./view-form/view-form.component";
import { ClasstypePopupComponent } from "./classtype-popup/classtype-popup.component";
import { LanguageService } from "@empowered/language";
import { ProductsPlansQuasiService } from "../../maintenance-benefits-offering/products-plans-quasi/services/products-plans-quasi.service";
import { Router, ActivatedRoute } from "@angular/router";
import { ConfigName, GroupAttributeEnum, SYMBOLS, AccountImportTypes, CompanyCode, GroupAttribute, CarrierId } from "@empowered/constants";
import { ConfirmQ60PopupComponent } from "./confirm-q60-popup/confirm-q60-popup.component";
import { StaticUtilService } from "@empowered/ngxs-store";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
const Q60 = "Q60";
const CARRIER_FORM_GROUP_ATTRIBUTE_VALUE = "6";

@Component({
    selector: "empowered-carrier-forms",
    templateUrl: "./carrier-forms.component.html",
    styleUrls: ["./carrier-forms.component.scss"],
})
export class CarrierFormsComponent implements OnInit, OnDestroy {
    @Select(BenefitsOfferingState.getUnapprovedCarrierForms) forms$: Observable<CarrierFormWithCarrierInfo[]>;
    @Input() maintain: boolean;
    @Input() productCarrierId: number;
    columnHeaders = ["logo", "name", "status", "button"];
    carrierSetupStLength: number;
    carrierId: number;
    carrierIds: number[] = [];
    carrierIdNums: number[] = [];
    classTypeId: number;
    showdual = true;
    showstandard = true;
    classesData: any;
    isLoading = false;
    errorResponse = false;
    errorMessage: string;
    groupSitusState: string;
    hasError: boolean;
    FormStatusEnum = CarrierFormSetupStatus;
    fullTimeArray: string[] = [];
    partTimeArray: string[] = [];
    groupReplacementId: string;
    agentReplacementId: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.carrierforms.complete",
        "primary.portal.carrierforms.incomplete",
        "primary.portal.carrierforms.resume",
        "primary.portal.carrierforms.reviewoffering",
        "primary.portal.carrierforms.start",
        "primary.portal.carrierForms.carrierForm",
        "primary.portal.common.servertimeout",
        "primary.portal.common.view",
        "primary.portal.common.back",
    ]);
    isAccountDeactivated: boolean;
    offeringSteps = this.store.selectSnapshot(BenefitsOfferingState.getOfferingStepperData);
    isSitusState = false;
    companyCodeNY = CompanyCode.NY;
    masterAppStatus: string;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly aflacService: AflacService,
        private readonly language: LanguageService,
        private readonly accountProfileService: AccountProfileService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
    ) {}

    /**
     * Angular lifecycle method to initialize component
     * set form data
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.errorResponse = false;

        /**
         * in order for the PEO modal to pop up, the following conditions have to be met:
         * 1) there's an Aflac carrier visible class type defined for the account,
         * 2) there are no classes for this visible class type,
         * 3) there's no dual PEO selection for this account,
         * 4) there should be sic code and not industry code with the account.
         * 5) the sic code should NOT be a default sic code - default will be false in two scenarios, when the
         *    default sic code group attribute is either not returned at all or is returned with a value of "false"
         */
        this.accountService
            .getGroupAttributesByName([
                GroupAttributeEnum.SIC_CODE,
                GroupAttributeEnum.INDUSTRY_CODE,
                GroupAttributeEnum.IS_DEFAULT_SIC_CODE,
                GroupAttributeEnum.MASTER_APP_STATUS,
            ])
            .pipe(
                first(),
                tap((res) => {
                    this.masterAppStatus = res.find(
                        (groupAttribute) => groupAttribute.attribute === GroupAttributeEnum.MASTER_APP_STATUS,
                    )?.value;
                }),
                filter(
                    (attributes) =>
                        !!(
                            attributes &&
                            attributes.length &&
                            attributes.some(
                                (groupAttribute) => groupAttribute.attribute === GroupAttributeEnum.SIC_CODE && groupAttribute.value,
                            ) &&
                            attributes.some(
                                (groupAttribute) => groupAttribute.attribute === GroupAttributeEnum.INDUSTRY_CODE && !groupAttribute.value,
                            ) &&
                            this.filterIsNotDefaultSIC(attributes)
                        ),
                ),
                switchMap((attributes) => this.accountProfileService.getClassTypes().pipe(first())),
                filter((classTypes) => classTypes.filter((classType) => classType.carrierId === CarrierId.AFLAC).length > 0),
                switchMap((classTypes) => {
                    this.classTypeId = classTypes.filter((classType) => classType.carrierId === CarrierId.AFLAC)[0].id;
                    return this.accountProfileService.getClasses(this.classTypeId).pipe(first());
                }),
                filter((classes) => classes && classes.length === 0),
                switchMap(() => this.aflacService.getDualPeoSelection().pipe(first())),
                filter((dualPeoSelection) => !dualPeoSelection),
                tap(() => this.showClassTypePopup(this.classTypeId)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.transFormObservable(this.store.dispatch(new SetUnapprovedPlanChoices())).subscribe();
        // Get all forms, update status of forms which have status undefined. Reload all forms.
        // transFormObservable takes care of unsubscribing
        this.benefitOfferingHelperService
            .setupCarrierFormDataToStore(this.maintain, this.productCarrierId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.isLoading = false;
            });

        if (this.maintain) {
            this.quasiService.stepClicked$.next(this.offeringSteps.CARRIER_FORMS);
        } else {
            this.sideNavService.stepClicked$.next(this.offeringSteps.CARRIER_FORMS);
        }
        this.fetchAccountStatus();
        this.isSitusState = this.sideNavService.fetchAccountSitus() === CompanyCode.NY;
        this.groupSitusState = this.sideNavService.fetchAccountSitus();
        this.sideNavService
            .updateGroupBenefitOfferingStep(CARRIER_FORM_GROUP_ATTRIBUTE_VALUE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.staticUtilService
            .cacheConfigValue(ConfigName.CARRIER_FORM_Q60_FULLTIME_PARTTIME)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((response) => {
                    this.fullTimeArray = response.split(SYMBOLS.COMMA)[0].split(SYMBOLS.EQUAL)[1].split(SYMBOLS.COLON);
                    this.partTimeArray = response.split(SYMBOLS.COMMA)[1].split(SYMBOLS.EQUAL)[1].split(SYMBOLS.COLON);
                }),
            )
            .subscribe();
        this.staticUtilService
            .cacheConfigValue(ConfigName.CARRIER_FORM_Q60_REPLACEMENT_QUESTION_IDS)
            .pipe(
                tap((response) => {
                    this.groupReplacementId = response?.split(SYMBOLS.COMMA)[0].split(SYMBOLS.EQUAL)[1];
                    this.agentReplacementId = response?.split(SYMBOLS.COMMA)[1].split(SYMBOLS.EQUAL)[1];
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Used to determine if a group attribute for default sic code is returned or not
     * If it is returned its value should be set to "false"
     * @param attributes array of attributes from Group Attributes account service
     *   checking for group attribute is_default_sic_code
     * @returns boolean. true is NOT default sic, false is default sic
     */
    filterIsNotDefaultSIC(attributes: GroupAttribute[]): boolean {
        const attrIsDefaultSic = attributes.find((groupAttribute) => groupAttribute.attribute === GroupAttributeEnum.IS_DEFAULT_SIC_CODE);
        // No group attribute returned for IS_DEFAULT_SIC_CODE
        if (!attrIsDefaultSic) {
            return true;
        }
        // Group attribute for IS_DEFAULT_SIC_CODE returned, but there is no default sic code
        return attrIsDefaultSic?.value === "false";
    }

    /**
     * Open view form modal for the respective carrier form
     * @param form carrier form with carrier information
     */
    openViewFormModal(form: CarrierFormWithCarrierInfo): void {
        const dialogRef: MatDialogRef<ViewFormComponent> = this.dialog.open(ViewFormComponent, {
            data: {
                form: form,
                groupSitusState: this.groupSitusState,
                fullTimeArray: this.fullTimeArray,
                partTimeArray: this.partTimeArray,
                groupReplacementId: this.groupReplacementId,
                agentReplacementId: this.agentReplacementId,
                useUnapproved: true,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(take(1), takeUntil(this.unsubscribe$))
            .subscribe(() => (this.errorResponse = false));
    }
    onBack(): void {
        if (this.maintain) {
            this.quasiService.stepClicked$.next(this.offeringSteps.CARRIER_FORMS - 1);
        } else {
            this.sideNavService.stepClicked$.next(this.offeringSteps.CARRIER_FORMS - 1);
        }
    }
    /**
     * Determines whether the Q60k popup needs to be displayed or continue to the review offering page
     */
    reviewOffering(): void {
        const planChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
        this.carrierIds = this.getCarrierIdsFromStore();
        if (
            planChoices.some((planChoice) => planChoice.plan.policySeries.includes(Q60)) &&
            this.carrierIds.some((carrierId) => carrierId === CarrierId.AFLAC) &&
            this.masterAppStatus !== ApplicationStatusTypes.Approved
        ) {
            this.showConfirmQ60Popup(CarrierId.AFLAC);
        } else {
            this.submitOffering();
        }
    }

    /**
     * Function to returns carrier Ids from store
     * @return array of carrierId
     */
    getCarrierIdsFromStore(): number[] {
        const carrierFormsFromStore = this.store.selectSnapshot(BenefitsOfferingState.getAllCarrierForms);
        // returns empty if no value is present in store
        if (!carrierFormsFromStore) {
            return [];
        }
        // map the carrier ids from carrier forms
        return carrierFormsFromStore.map((carrierForms) => carrierForms.carrierId);
    }
    /**
     * Navigates to Review offering page and ensures all carrier forms are filled
     */
    submitOffering(): void {
        const carrierFormsFromStore = this.store.selectSnapshot(BenefitsOfferingState.getAllCarrierForms);
        const incompleteForms = carrierFormsFromStore.filter((form) =>
            [CarrierFormSetupStatus.INCOMPLETE, CarrierFormSetupStatus.NOT_STARTED].includes(form.formStatus as CarrierFormSetupStatus),
        );
        const accountDetails: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const allFormsComplete = incompleteForms.length === 0;
        if (!allFormsComplete) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                "secondary.portal.benefitsOffering.carrierforms.errors.incompleteForms",
            );
            this.errorResponse = true;
        } else if (!this.maintain && accountDetails && accountDetails.importType === AccountImportTypes.SHARED_CASE) {
            this.router.navigate(["../ag-review"], { relativeTo: this.activatedRoute });
        } else {
            if (this.maintain) {
                this.quasiService.defaultStepPositionChanged$.next(this.offeringSteps.REVIEW_SUBMIT + 1);
            } else {
                this.sideNavService.defaultStepPositionChanged$.next(this.offeringSteps.REVIEW_SUBMIT + 1);
            }
        }
    }

    /**
     * Opens the Q60k pop up
     *
     * @param carrierId
     * @param carrierFormsComponent
     */
    showConfirmQ60Popup(carrierId: number): void {
        this.empoweredModalService
            .openDialog(ConfirmQ60PopupComponent, {
                data: { carrierId },
            })
            .afterClosed()
            .pipe(
                filter((data) => data === "SUBMIT_OFFERING"),
                tap((data) => this.submitOffering()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    // show pop up only if it wasn't set earlier
    showClassTypePopup(carrierId: number): void {
        // setTimeout to load data for the dialog
        setTimeout(() =>
            this.dialog.open(ClasstypePopupComponent, {
                hasBackdrop: true,
                maxWidth: "667px",
                data: {
                    carrierId: carrierId,
                },
            }),
        );
    }

    transFormObservable(obs: Observable<any>): Observable<any> {
        return obs.pipe(
            take(1),
            takeUntil(this.unsubscribe$),
            catchError((err) => {
                this.hasError = true;
                return of(null);
            }),
        );
    }
    // This method is used to check the account status
    fetchAccountStatus(): void {
        this.isAccountDeactivated = this.sideNavService.fetchAccountStatus();
    }
    /**
     * function to check NY situs with RSLI carrier
     * @param carrierId selected carrierId
     * @returns true for NY situs with RSLI carrier
     */
    isSitusNyRSLI(carrierId: number): boolean {
        return this.isSitusState && carrierId === CarrierId.RSLI;
    }
    /**
     * destroying subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
