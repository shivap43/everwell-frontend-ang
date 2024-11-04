import { CoreService, PlanDocument, PlanDetailsBase, ResourceType, PlanDetails, DocumentApiService } from "@empowered/api";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, OnInit, Inject, OnDestroy, Optional } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { Subscription, combineLatest, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { SharePlanDocuments, PlanDocumentType, ProductId, CompanyCode, PlanDetailDialogData, DateFormats } from "@empowered/constants";
import { CurrencyPipe } from "@angular/common";
import { takeUntil } from "rxjs/operators";
import { StaticUtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { SharePlanResourceComponent } from "../../business/share-plan-resource/share-plan-resource.component";
import { DateService } from "@empowered/date";
import { Router } from "@angular/router";

const COVERAGE_SUMMARY_PATH = "coverage-summary";

@Component({
    selector: "empowered-plan-details",
    templateUrl: "./plan-details.component.html",
    styleUrls: ["./plan-details.component.scss"],
})
export class PlanDetailsComponent implements OnInit, OnDestroy {
    sharePlanResourceComponent: MatDialogRef<SharePlanResourceComponent>;
    form: FormGroup;
    planDocuments: PlanDocument[] = [];
    planVideos: PlanDocument[] = [];
    allPlanDocuments: PlanDocument[] = [];
    videoURL: string;
    videoName: string;
    presentVideo: number;
    isDataAvailable: boolean;
    getDocumentsSubscription: Subscription;
    getDetailsSubscription: Subscription;
    getLinksSubscription: Subscription;
    carrierLinks = [];
    showSpinner = true;
    languageStrings = {
        select: this.language.fetchPrimaryLanguageValue("primary.portal.common.placeholderSelect"),
        close: this.language.fetchPrimaryLanguageValue("primary.portal.common.close"),
        viewDocument: this.language.fetchPrimaryLanguageValue("primary.portal.planDetails.view"),
        details: this.language.fetchPrimaryLanguageValue("primary.portal.planDetails.detailsTab"),
        document: this.language.fetchPrimaryLanguageValue("primary.portal.planDetails.documentTab"),
        videos: this.language.fetchPrimaryLanguageValue("primary.portal.planDetails.videosTab"),
        links: this.language.fetchPrimaryLanguageValue("primary.portal.planDetails.links"),
    };
    planDetails: PlanDetailsBase;
    productId: number;
    carrierId: number;
    planDescription: string;
    ageRestrictionMessage: string;
    validityMessage: string;
    eligibleSubscriberMessage: string;
    basePremiumMessage: string;

    RSLI_CARRIER_ID = 60;
    MEMD_CARRIER_ID = 58;
    VISION_PRODUCT_ID = 30;
    MIN_AGE: number;
    MAX_AGE: number;
    MAX_SUBSCRIBERS: number;
    minAgeConfig = "general.data.subscriber_min_age";
    maxAgeConfig = "general.data.maximum_subscriber_age";
    maxSubscribersConfig = "general.data.max_subscribers";
    displayPlanDetails = true;
    deltaDentalPlanDetails: PlanDetails[] = [];
    private readonly unsubscribe$ = new Subject<void>();
    languageStringArray = this.language.fetchPrimaryLanguageValues([
        "primary.portal.planDetails.eligibleAgeCriteria",
        "primary.portal.planDetails.maxAgePlanCriteria",
        "primary.portal.planDetails.minAgePlanCriteria",
        "primary.portal.planDetails.ageRangeCrieteria",
        "primary.portal.planDetails.noAgeCriteria",
        "primary.portal.planDetails.ageRestrictionWarning",
        "primary.portal.planDetails.effectiveStartdate",
        "primary.portal.planDetails.threeOrMore",
        "primary.portal.planDetails.minEligibleSub",
        "primary.portal.planDetails.eligibleRangeSub",
        "primary.portal.planDetails.premiumStartPrice",
        "primary.portal.planDetails.shareResources",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: PlanDetailDialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<PlanDetailsComponent>,
        private readonly coreService: CoreService,
        private readonly sanitizer: DomSanitizer,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly currencyPipe: CurrencyPipe,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly documentService: DocumentApiService,
        private readonly dateService: DateService,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            defaultState: [this.data.states[0].abbreviation],
        });
        this.getDocuments(this.data.states[0].abbreviation);
        this.getPlanDetail();
        if (this.data.carrierId) {
            this.getCarrierContacts();
        }
    }
    /**
     * Fetch documents related to particular plan either videos or documents
     * @param state: state for which documents will be fetched
     */
    getDocuments(state: string): void {
        const planIds: number[] = [];
        planIds.push(+this.data.planId);
        (this.data.riderIds || []).map((id) => planIds.push(id));
        if (this.isDentalMatrixFormRequired(this.data.situsState)) {
            state = this.data.situsState;
        }
        this.coreService
            .getPlanDocuments(
                planIds,
                state,
                this.data.mpGroup ? this.data.mpGroup.toString() : null,
                undefined,
                undefined,
                undefined,
                this.data.channel,
                this.data.referenceDate,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.showSpinner = false;
                this.allPlanDocuments = response;
                if (this.isDentalMatrixFormRequired(state)) {
                    this.planDocuments = response.filter(
                        (documentData: PlanDocument) =>
                            documentData.type === PlanDocumentType.BROCHURE || documentData.type === PlanDocumentType.OTHER,
                    );
                } else {
                    this.planDocuments = response.filter((documentData: PlanDocument) => documentData.type === PlanDocumentType.BROCHURE);
                }
                this.planVideos = response.filter((videoData: PlanDocument) => videoData.type === ResourceType.VIDEO);
                if (this.planVideos.length > 0) {
                    this.videoURL = this.safeURL(this.planVideos[0].location.split("?", 1)[0]);
                    this.videoName = this.planVideos[0].name;
                    this.presentVideo = 0;
                }
            });
    }

    /**
     * Function will decide wether form for dental product should be fetched or not
     * @params situsState string
     * @returns boolean
     */
    isDentalMatrixFormRequired(situsState: string): boolean {
        // Skip dental matrix document display if flow is of coverage summary
        if (this.router.url.includes(COVERAGE_SUMMARY_PATH)) {
            return false;
        }
        return this.data.isCarrierOfADV && this.data.productId === ProductId.DENTAL && situsState === CompanyCode.CA;
    }
    /**
     * function called to download the document
     * @param event: PlanDocument
     */
    viewFile(event: PlanDocument): void {
        const fileName = event.name;
        this.documentService
            .downloadDocument(event.documentId, this.data.mpGroup ? this.data.mpGroup : null)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                const blob = new Blob([response], {
                    type: "application/pdf",
                });

                /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                if ((window.navigator as any).msSaveOrOpenBlob) {
                    (window.navigator as any).msSaveOrOpenBlob(blob);
                } else {
                    const anchor = document.createElement("a");
                    anchor.download = fileName;
                    const fileURLBlob = URL.createObjectURL(blob);
                    anchor.href = fileURLBlob;
                    document.body.appendChild(anchor);
                    anchor.click();
                }
            });
    }

    /**
     *@description function to close plan details modal.
     */
    closeDialog(): void {
        this.matDialogRef.close();
    }
    /* Bypass security and trust the given value to be a safe style URL*/
    // TODO - Check on dev if it works without bypassing security url else revert to this code.
    safeURL(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    /* Play the video selected*/
    playVideo(currentVideo: number, urlLocation: string, videoName: string): void {
        const URL = this.safeURL(urlLocation.split("?", 1)[0]);
        this.videoURL = URL;
        this.videoName = videoName;
        this.presentVideo = currentVideo;
    }
    /* get plan details for particular plan*/
    getPlanDetail(): void {
        this.getDetailsSubscription = combineLatest(
            this.coreService.getPlanDetails(+this.data.planId),
            this.coreService.getPlan(+this.data.planId),
            this.staticUtilService.cacheConfigValue(this.minAgeConfig),
            this.staticUtilService.cacheConfigValue(this.maxAgeConfig),
            this.staticUtilService.cacheConfigValue(this.maxSubscribersConfig),
        ).subscribe((data) => {
            this.planDetails = data[0];
            this.planDetails.planDetailItems.forEach((planDetail) => {
                if (planDetail.coverageDetailDisplayName.includes("{glossary}")) {
                    planDetail.coverageDetailDisplayName = planDetail.coverageDetailDisplayName.replace(/{glossary}/g, "");
                }
                this.deltaDentalPlanDetails.push(planDetail);
            });
            this.productId = data[1].product.id;
            this.carrierId = data[1].carrierId;
            this.planDescription = data[1].description;
            this.MIN_AGE = +data[2];
            this.MAX_AGE = +data[3];
            this.MAX_SUBSCRIBERS = +data[4];
            if (this.planDetails) {
                this.ageRestrictionMessage = this.getAgeRestrictionMessage();
                this.validityMessage = this.getValidityMessage();
                this.eligibleSubscriberMessage = this.getEligibleSubscriberMessage();
                this.basePremiumMessage = this.getBasePremiumMessage();
            }
        });
    }

    /* get links based on carrier*/
    getCarrierContacts(): void {
        this.getLinksSubscription = this.coreService.getCarrierContacts(this.data.carrierId).subscribe((response) => {
            this.carrierLinks = response;
        });
    }

    /**
     * Set the messages displayed in the "Details" tab
       Age Restriction Message
        * if RSLI(60) carrier and VISION(30) product
        ageRestrictionMessage: "Actively at work, benefit eligible employees"
        * if plan max age <200 and plan min age <=0
        ageRestrictionMessage: "Up to ${planMax} years old"
        * if plan max age >=200 and plan min age >0
        ageRestrictionMessage: "At least ${planMin} years old"
        * if plan max age <200 and plan min >0
        ageRestrictionMessage: "Age ${PlanMin} to ${PlanMix}"
        else
        ageRestrictionMessage: "No age restrictions"
        and configured "(may vary by state)" text in content_language table
     */
    getAgeRestrictionMessage(): string {
        let str = "";
        if (this.carrierId === this.RSLI_CARRIER_ID && this.productId === this.VISION_PRODUCT_ID) {
            str = this.languageStringArray["primary.portal.planDetails.eligibleAgeCriteria"];
        } else if (this.planDetails.maxAge < this.MAX_AGE && this.planDetails.minAge <= this.MIN_AGE) {
            str = this.languageStringArray["primary.portal.planDetails.maxAgePlanCriteria"];
        } else if (this.planDetails.maxAge >= this.MAX_AGE && this.planDetails.minAge > this.MIN_AGE) {
            str = this.languageStringArray["primary.portal.planDetails.minAgePlanCriteria"];
        } else if (this.planDetails.maxAge < this.MAX_AGE && this.planDetails.minAge > this.MIN_AGE) {
            str = this.languageStringArray["primary.portal.planDetails.ageRangeCrieteria"];
        } else {
            str = this.languageStringArray["primary.portal.planDetails.noAgeCriteria"];
        }
        str += this.languageStringArray["primary.portal.planDetails.ageRestrictionWarning"];
        return str.replace("#planmin", this.planDetails.minAge.toString()).replace("#planmax", this.planDetails.maxAge.toString());
    }

    /**
     * If not RSLI(60) carrier and not vision(30) product then show
        Offer effective starting ${plan.effectiveDate}
     */
    getValidityMessage(): string {
        let str = "";
        if (
            this.carrierId !== this.RSLI_CARRIER_ID &&
            this.productId !== this.VISION_PRODUCT_ID &&
            this.planDetails.validity &&
            this.planDetails.validity.effectiveStarting
        ) {
            const date = this.dateService.format(this.planDetails?.validity?.effectiveStarting, DateFormats.MONTH_DAY_YEAR).valueOf();
            str = this.languageStringArray["primary.portal.planDetails.effectiveStartdate"].replace("#effectivedate", date);
        }
        return str;
    }

    /**
     * Number of eligible subscribers
        if carrier is MeMD (58) then
        Number of eligible subscribers must be 3 or more employees
        if plan.maxEligibleSubscribers == 1000000 && plan.carrier.id != 58 then
        Number of eligible subscribers must be ${plan.minEligibleSubscribers} or more employees
        if carrier RSLI (60) && product vision (30) then
        Number of eligible subscribers must be ${overallMinEligibleEmployees} to ${overallMaxEligibleEmployees} employees
        else
        Number of eligible subscribers must be ${plan.minEligibleSubscribers} to ${plan.maxEligibleSubscribers} employees
     */
    getEligibleSubscriberMessage(): string {
        let str = "";
        if (this.carrierId === this.MEMD_CARRIER_ID) {
            str = this.languageStringArray["primary.portal.planDetails.threeOrMore"];
        } else if (this.planDetails.maxEligibleSubscribers === this.MAX_SUBSCRIBERS && this.carrierId !== this.MEMD_CARRIER_ID) {
            str = this.languageStringArray["primary.portal.planDetails.minEligibleSub"];
        } else if (this.carrierId === this.RSLI_CARRIER_ID && this.productId === this.VISION_PRODUCT_ID) {
            str = this.languageStringArray["primary.portal.planDetails.eligibleRangeSub"];
        } else {
            str = this.languageStringArray["primary.portal.planDetails.eligibleRangeSub"];
        }
        return str
            .replace("#mineligiblesubscribers", this.planDetails.minEligibleSubscribers.toString())
            .replace("#maxeligiblesubscribers", this.planDetails.maxEligibleSubscribers.toString());
    }

    /**
     * If not RSLI (60) carrier and not vision(30) product and if plan has price
        Premiums start at ${startingPrice} per month
     */
    getBasePremiumMessage(): string {
        let str = "";
        if (
            this.carrierId !== this.RSLI_CARRIER_ID &&
            this.productId !== this.VISION_PRODUCT_ID &&
            this.planDetails.lowestBasePremium != null
        ) {
            const price = this.currencyPipe.transform(this.planDetails.lowestBasePremium);
            str = this.languageStringArray["primary.portal.planDetails.premiumStartPrice"].replace("$#startingprice", price);
        }
        return str;
    }
    /**
     *@description function to Open share plan resource model and hide plan details model.
     * After close based on button click from share plan resource model, open or close plan details model
     */
    shareResource(): void {
        this.displayPlanDetails = false;
        this.sharePlanResourceComponent = this.empoweredModalService.openDialog(SharePlanResourceComponent, {
            data: { planDetails: this.data, planDocuments: this.allPlanDocuments },
        });
        this.sharePlanResourceComponent
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res: string) => {
                if (res && res === SharePlanDocuments.BACK_TO_PLAN_DETAILS) {
                    this.displayPlanDetails = true;
                } else {
                    this.closeDialog();
                }
            });
    }

    /**
     * Unsubscribe the subscriptions to avoid memory leaks
     */
    ngOnDestroy(): void {
        if (this.getDocumentsSubscription !== undefined) {
            this.getDocumentsSubscription.unsubscribe();
        }
        if (this.getDetailsSubscription !== undefined) {
            this.getDetailsSubscription.unsubscribe();
        }
        if (this.getLinksSubscription !== undefined) {
            this.getLinksSubscription.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
