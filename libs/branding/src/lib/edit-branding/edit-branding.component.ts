import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Observable, of, Subject, iif, defer, BehaviorSubject, combineLatest, race, EMPTY } from "rxjs";
import { DEEP_CLONE_BRANDING } from "../models/branding.functions";
import { Store } from "@ngxs/store";
import {
    filter,
    switchMap,
    shareReplay,
    map,
    takeUntil,
    retry,
    startWith,
    distinctUntilChanged,
    withLatestFrom,
    delay,
    tap,
    catchError,
} from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";
import { CanComponentDeactivate } from "@empowered/ui";
import { BrandingModalExitComponent } from "../modals/branding-modal-exit/branding-modal-exit.component";
import {
    AccountService,
    DocumentApiService,
    BRANDING_UPLOAD_COMPLETE,
    BrandingType,
    BrandingColorFormat,
    FIELD_CUSTOM_LOGO,
    BrokerageService,
} from "@empowered/api";
import { BrandingModalDeleteComponent } from "../modals/branding-modal-delete/branding-modal-delete.component";
import { HttpEventType, HttpResponse } from "@angular/common/http";
import { BrandingLogoFormComponent } from "../forms/branding-logo-form/branding-logo-form.component";
import { LanguageService } from "@empowered/language";
import { BrandingLanguage, ClientErrorResponseCode, ConfigName, DECIMAL, END_INDEX, START_INDEX } from "@empowered/constants";
import { MPGroupAccountService, EmpoweredModalService, FileUploadService } from "@empowered/common-services";
import {
    StaticUtilService,
    GetBranding,
    ResetBranding,
    BrandingDomainType,
    BrandingState,
    DereferencedBrandingModel,
    COMPARE_BRANDING_DATA,
} from "@empowered/ngxs-store";

const BRANDING_ROUTE_DATA_VARIABLE = "brandingDomainType";

/**
 * Helper interface to qualify a color value
 */
interface ColorFormat {
    type: BrandingColorFormat;
    value: string;
}

const API_RETRY = 5;
const OBSERVABLE_TIMEOUT = 5000;
const DEFAULT_COLOR = "00aab9";

/**
 * The edit screen for the branding feature
 *
 * Requires the route data variable "brandingDomainType" and accepts either "ACCOUNT" or "BROKERAGE"
 */
@Component({
    selector: "empowered-edit-branding",
    templateUrl: "./edit-branding.component.html",
    styleUrls: ["./edit-branding.component.scss"],
})
export class EditBrandingComponent implements OnInit, OnDestroy, CanComponentDeactivate {
    @ViewChild(BrandingLogoFormComponent, { static: true }) logoForm: BrandingLogoFormComponent;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    DEFAULT_BRANDING!: DereferencedBrandingModel;
    // file upload error message
    pleaseUploadFileErrorMsg = this.language.fetchPrimaryLanguageValue("primary.portal.branding.error.pleaseUploadFile");
    // virus scan failed field message
    virusDetectedFieldMsg = this.language.fetchPrimaryLanguageValue("primary.portal.members.document.addUpdate.virusDetected.fieldMessage");
    // The type of domain this branding form is for (Account or Brokerage)
    brandingDomainType$: Observable<BrandingDomainType> = this.activatedRoute.data.pipe(
        // Get the data
        map((routeData) => routeData[BRANDING_ROUTE_DATA_VARIABLE]),
        // Only emit if present
        filter((routerData) => Boolean(routerData)),
        // Cast to maintain uniformity
        map((routerData) => routerData as BrandingDomainType),
        shareReplay(1),
    );

    // The name of the group
    groupName$: Observable<string> = this.mpGroup.mpGroupAccount$.pipe(
        filter((account) => Boolean(account)),
        map((account) => account.name),
    );

    // Gets the current mp group in context or undefined if there is none
    groupId$: Observable<number | undefined> = this.mpGroup.mpGroupAccount$.pipe(map((account) => (account ? account.id : undefined)));

    // If the branding has custom branding or not
    hasCustomBranding$: Observable<boolean> = combineLatest(this.brandingDomainType$, this.groupId$).pipe(
        filter(([domainType, accountId]) => Boolean((domainType === BrandingDomainType.ACCOUNT && accountId) || domainType)),
        tap(([domainType, accountId]) => this.store.dispatch(new GetBranding(domainType, accountId, true))),
        switchMap(([domainType, accountId]) => this.store.select(BrandingState.getDereferencedBrandingList(domainType, accountId))),
        map((brandings) => Boolean(brandings && brandings.length > 0)),
    );

    // If the latest branding is pending
    isPending$: Observable<boolean> = this.brandingDomainType$.pipe(
        withLatestFrom(this.groupId$),
        filter(([domainType, accountId]) => Boolean((domainType === BrandingDomainType.ACCOUNT && accountId) || domainType)),
        switchMap(([domainType, accountId]) => this.store.select(BrandingState.getLatestBranding(domainType, accountId, null))),
        map((branding) => branding && !BRANDING_UPLOAD_COMPLETE(branding)),
    );

    // Temporary variable, used if the logo upload succeeds but the branding upload fails
    uploadedLogoId: number;

    initialBranding: DereferencedBrandingModel = this.DEFAULT_BRANDING;
    private updatedBranding: DereferencedBrandingModel;
    private readonly updatedBrandingSubject$: BehaviorSubject<DereferencedBrandingModel> = new BehaviorSubject<DereferencedBrandingModel>(
        undefined,
    );

    // The branding being updated by the form initialized by the current branding
    updatedBranding$: Observable<DereferencedBrandingModel> = this.updatedBrandingSubject$.asObservable().pipe(
        filter((branding) => Boolean(branding)),
        shareReplay(1),
        tap((branding) => {
            this.uploadedLogoId = undefined;
        }),
    );

    // If the branding is allowed to be saved (if it has been edited)
    canSaveBranding$: Observable<boolean> = this.updatedBranding$.pipe(
        map(
            (updatedBranding) =>
                this.hasInitialBranding &&
                COMPARE_BRANDING_DATA(this.initialBranding, this.updatedBranding) &&
                updatedBranding &&
                updatedBranding.type === BrandingType.CUSTOM &&
                "id" in updatedBranding,
        ),
    );

    // checks the users associated delete permission based on the given domain type
    hasDeletePermission$: Observable<boolean> = this.brandingDomainType$.pipe(
        switchMap((domainType) =>
            this.staticUtilService.hasPermission(
                domainType === BrandingDomainType.ACCOUNT ? "core.account.delete.branding" : "core.producer.delete.brokerage.branding",
            ),
        ),
        shareReplay(1),
    );

    // checks the users associated create permission based on the given domain type
    hasCreatePermission$: Observable<boolean> = this.brandingDomainType$.pipe(
        switchMap((domainType) =>
            this.staticUtilService.hasPermission(
                domainType === BrandingDomainType.ACCOUNT ? "core.account.create.branding" : "core.producer.create.brokerage.branding",
            ),
        ),
        shareReplay(1),
    );

    private readonly currentModelSavedSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    currentModelSaved$: Observable<boolean> = this.currentModelSavedSubject$.asObservable().pipe(shareReplay(1));
    private readonly errorMessageSubject$: BehaviorSubject<string> = new BehaviorSubject<string>("");
    errorMessage$: Observable<string> = this.errorMessageSubject$.asObservable();

    hasInitialBranding = false;
    bothBrandingEnabled = false;
    multipartFileUploadConfig = false;
    brandingFile: File;

    constructor(
        private readonly store: Store,
        private readonly activatedRoute: ActivatedRoute,
        private readonly modalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly documentService: DocumentApiService,
        private readonly mpGroup: MPGroupAccountService,
        private readonly language: LanguageService,
        private readonly brokerageService: BrokerageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly fileUploadService: FileUploadService,
    ) {}
    /**
     * Opens a dialog on an attempt to leave to determine if the user would like to save their progress or not
     * @returns An observable for the user's response to the dialog
     */
    canDeactivate(): Observable<boolean> {
        return iif(
            // Compare the branding...
            () => COMPARE_BRANDING_DATA(this.initialBranding, this.updatedBranding),
            // ...If the branding is the same, default to true.
            defer(() => of(true)),
            // ...Otherwise, show the modal and ask the user to confirm
            defer(() =>
                this.modalService
                    .openDialog(BrandingModalExitComponent)
                    .afterClosed()
                    .pipe(map((resp) => Boolean(resp))),
            ),
        );
    }

    /**
     * Initializes up all the observables needed for the feature
     */
    ngOnInit(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled("general.branding.standard.setUp_flag"),
            this.staticUtilService.cacheConfigEnabled("general.branding.custom.setUp_flag"),
            this.staticUtilService.cacheConfigEnabled(ConfigName.ALLOW_MULTIPART_FILE_UPLOAD),
        ])
            .pipe(
                tap(([standard, custom, isMultipartFileUploadEnabled]) => {
                    // When both config is enabled
                    this.multipartFileUploadConfig = isMultipartFileUploadEnabled;
                    if (standard && custom) {
                        this.bothBrandingEnabled = true;
                        this.DEFAULT_BRANDING = {
                            type: BrandingType.STANDARD,
                            colorFormat: BrandingColorFormat.HEX,
                            colorCode: DEFAULT_COLOR,
                            standardLogos: {
                                smallLogo: {},
                                largeLogo: {},
                            },
                        };
                    } else if (custom) {
                        this.DEFAULT_BRANDING = {
                            type: BrandingType.CUSTOM,
                            colorCode: DEFAULT_COLOR,
                            colorFormat: BrandingColorFormat.HEX,
                            customLogo: {
                                logoData: null,
                            },
                        };
                    } else {
                        this.DEFAULT_BRANDING = {
                            type: BrandingType.STANDARD,
                            colorFormat: BrandingColorFormat.HEX,
                            colorCode: DEFAULT_COLOR,
                            standardLogos: {
                                smallLogo: {},
                                largeLogo: {},
                            },
                        };
                    }
                }),
                switchMap((configs) => this.brandingDomainType$),
                withLatestFrom(this.groupId$),
                switchMap(([domainType, accountId]) =>
                    race(
                        this.store.select(BrandingState.getLatestBranding(domainType, accountId, null)).pipe(
                            retry(API_RETRY),
                            filter((latestBranding) => Boolean(latestBranding)),
                        ),
                        of(this.DEFAULT_BRANDING).pipe(
                            // Giving time to set the latest observable if there is any
                            delay(OBSERVABLE_TIMEOUT),
                            switchMap((state) => this.store.select(BrandingState.getLatestBranding(domainType, accountId, null))),
                            filter((latestBranding) => Boolean(latestBranding)),
                            // setting default branding when there is no latest branding
                            startWith(this.DEFAULT_BRANDING),
                        ),
                    ),
                ),
                distinctUntilChanged((prev, curr) => prev && curr && prev.id === curr.id),
                tap((branding) => {
                    this.hasInitialBranding = "id" in branding;
                    this.initialBranding = DEEP_CLONE_BRANDING(branding);
                    this.updatedBranding = DEEP_CLONE_BRANDING(branding);
                    if (
                        this.updatedBranding.type.toLowerCase() !== this.DEFAULT_BRANDING.type.toLocaleLowerCase() &&
                        !this.bothBrandingEnabled
                    ) {
                        this.updatedBranding = this.DEFAULT_BRANDING;
                    }
                    this.updatedBrandingSubject$.next(this.updatedBranding);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Clean up subscriptions on destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * If the color updates, update the base model and the emit out the new model.
     * Needed so that if the user generates the standard logo it can tell the color
     * @param color The new color
     */
    onColorChange(color: ColorFormat): void {
        this.updatedBranding.colorFormat = color.type;
        this.updatedBranding.colorCode = color.value;
        this.updatedBrandingSubject$.next(this.updatedBranding);
        this.currentModelSavedSubject$.next(false);
    }

    /**
     * If the user updates the logo choice, update their selection
     * @param logoChanges The new logo data
     */
    onLogoChange(logoChanges: DereferencedBrandingModel): void {
        this.updatedBranding = logoChanges;
        this.updatedBrandingSubject$.next(this.updatedBranding);
        this.currentModelSavedSubject$.next(false);
    }

    /**
     * Show the branding dialog when the user clicks the link to delete the branding
     */
    removeBranding(): void {
        this.modalService
            .openDialog(BrandingModalDeleteComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this.brandingDomainType$, this.groupId$),
                switchMap(([, domainType, id]) => this.store.dispatch(new ResetBranding(domainType, id))),
                withLatestFrom(this.brandingDomainType$, this.groupId$),
                tap(([, brandingDomainType, accountId]) => {
                    this.store.dispatch(new GetBranding(brandingDomainType, accountId, true));
                    this.initialBranding = this.updatedBranding;
                    this.updatedBranding = this.DEFAULT_BRANDING;
                    this.updatedBrandingSubject$.next(this.DEFAULT_BRANDING);
                    this.currentModelSavedSubject$.next(false);
                    this.hasInitialBranding = "id" in this.updatedBranding;
                    this.logoForm.clearCustomImage();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Save the current branding if the user has edited it
     */
    submitBranding(): void {
        if (
            (!this.hasInitialBranding || !COMPARE_BRANDING_DATA(this.initialBranding, this.updatedBranding)) &&
            (this.updatedBranding.type === BrandingType.STANDARD || this.updatedBranding[FIELD_CUSTOM_LOGO].logoData)
        ) {
            // Clear out the error messaging if there is any
            this.errorMessageSubject$.next("");

            of(this.updatedBranding)
                .pipe(
                    // Pre-submission: Take care of any preprocessing that needs to happen before the branding is submitted
                    switchMap((updatedBranding) =>
                        iif(
                            // If it is standard branding or existing data url from the DB...
                            () =>
                                updatedBranding.type === BrandingType.STANDARD ||
                                typeof updatedBranding[FIELD_CUSTOM_LOGO].logoData === "object",
                            // ...No preprocessing needed, just return the branding (or adjust the logo id) to submit
                            defer(() => this.preprocessBranding(updatedBranding)),
                            // ...Otherwise if custom, save the uploaded image as a document
                            defer(() =>
                                iif(
                                    () => Boolean(this.uploadedLogoId),
                                    // Should already be updated with the latest uploaded document
                                    defer(() =>
                                        of(updatedBranding).pipe(
                                            map((branding) => {
                                                updatedBranding[FIELD_CUSTOM_LOGO].logoData = this.uploadedLogoId;
                                                return updatedBranding;
                                            }),
                                        ),
                                    ),
                                    // No document has been uploaded, upload it now
                                    defer(() => this.uploadDocument(updatedBranding)),
                                ),
                            ),
                        ),
                    ),
                    withLatestFrom(this.brandingDomainType$),
                    // Submit the branding to save
                    switchMap(([updatedBranding, domainType]) => this.uploadBranding(domainType, updatedBranding)),
                    tap((response) => {
                        this.logoForm.clearCustomImage();
                        this.currentModelSavedSubject$.next(true);
                    }),
                    catchError(() => EMPTY),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        } else {
            this.errorMessageSubject$.next(this.pleaseUploadFileErrorMsg);
        }
    }

    /**
     * Upload the branding logo to the document service
     *
     * @param updatedBranding the branding to convert
     * @returns the logo converted into a file
     */
    private uploadDocument(updatedBranding: DereferencedBrandingModel): Observable<DereferencedBrandingModel> {
        return of(updatedBranding).pipe(
            // Map the data URI to a file object
            map((branding) => this.mapBrandingToFile(branding)),
            // save the mapped file
            tap((file) => (this.brandingFile = file)),
            // Upload the file to aws s3 bucket
            switchMap((file) =>
                iif(
                    () => this.multipartFileUploadConfig,
                    of(null),
                    this.fileUploadService.upload(file).pipe(
                        tap(
                            () => {},
                            () => this.setErrorMessage("secondary.portal.shared.monUpload.genericError"),
                        ),
                    ),
                ),
            ),
            withLatestFrom(this.brandingDomainType$),
            // sending the file to the documents endpoint to process
            switchMap(([, domainType]) =>
                iif(
                    () => domainType === BrandingDomainType.ACCOUNT,
                    defer(() => this.documentService.uploadDocument(this.brandingFile, this.multipartFileUploadConfig)),
                    defer(() => this.brokerageService.uploadBrokerageDocument(this.brandingFile, this.multipartFileUploadConfig)),
                ).pipe(
                    retry(API_RETRY),
                    tap(
                        (next) => {},
                        (error) => {
                            let errorMessage = "";
                            if (error.status === ClientErrorResponseCode.RESP_400) {
                                if (error.error.details?.length && error.error.details[0].field === this.virusDetectedFieldMsg) {
                                    errorMessage = "primary.portal.members.document.addUpdate.virusDetectedError";
                                } else {
                                    errorMessage = BrandingLanguage.NO_BROKERAGE_TIED_ERROR;
                                }
                            } else {
                                errorMessage = BrandingLanguage.BRANDING_UPLOAD_FAILED_ERROR;
                            }
                            this.setErrorMessage(errorMessage);
                        },
                    ),
                    filter((httpEvent) => httpEvent.type === HttpEventType.Response),
                ),
            ),
            // after we receive the response, get the resource ID
            map((documentResponseEvent) =>
                parseInt(documentResponseEvent["headers"].get("location").split("/").slice(END_INDEX)[START_INDEX], DECIMAL),
            ),
            // Set the uploaded id in case the branding update fails
            tap((documentId) => (this.uploadedLogoId = documentId)),
            // Update the branding model with the new ID
            map((documentId) => {
                updatedBranding[FIELD_CUSTOM_LOGO].logoId = documentId;
                return updatedBranding;
            }),
        );
    }

    /**
     * Submit the custom branding to save
     *
     * @param domainType BROKERAGE or ACCOUNT to match what branding is being uploaded
     * @param updatedBranding the updated branding to save
     * @returns the observable that saves the branding
     */
    private uploadBranding(
        domainType: BrandingDomainType,
        updatedBranding: DereferencedBrandingModel,
    ): Observable<[HttpResponse<unknown>, BrandingDomainType, number]> {
        return (
            domainType === BrandingDomainType.ACCOUNT
                ? this.accountService.saveAccountBranding(updatedBranding)
                : this.brokerageService.saveBrokerageBranding(updatedBranding)
        ).pipe(
            retry(API_RETRY),
            withLatestFrom(this.brandingDomainType$, this.groupId$),
            tap(
                ([, brandingDomainType, accountId]) => {
                    this.uploadedLogoId = undefined;
                    this.store.dispatch(new GetBranding(brandingDomainType, accountId, true));
                },
                (error) =>
                    this.setErrorMessage(
                        error.status === ClientErrorResponseCode.RESP_400
                            ? BrandingLanguage.NO_BROKERAGE_TIED_ERROR
                            : BrandingLanguage.BRANDING_UPLOAD_FAILED_ERROR,
                    ),
            ),
        );
    }

    /**
     * Used to set error message
     * @param errorMsg is of type string used to show error message
     */
    setErrorMessage(errorMsg: string): void {
        if (errorMsg.includes("primary")) {
            this.errorMessageSubject$.next(this.language.fetchPrimaryLanguageValue(errorMsg));
        } else {
            this.errorMessageSubject$.next(this.language.fetchSecondaryLanguageValue(errorMsg));
        }
    }

    /**
     * Transform the branding logo to a file
     *
     * @param branding the branding to transform
     * @returns the logo in file form
     */
    private mapBrandingToFile(branding: DereferencedBrandingModel): File {
        const splitURI: string[] = branding[FIELD_CUSTOM_LOGO].logoData.split(",");
        const baseImage: string = splitURI[1];
        const decodedBaseImageSize: number = atob(baseImage)
            .split("")
            .map((stringChar) => stringChar.charCodeAt(0)).length;

        // create an ArrayBuffer with a size in bytes
        const buffer = new ArrayBuffer(decodedBaseImageSize);
        const uint8 = new Uint8Array(buffer);

        // setting the value into array uint8
        uint8.set(
            atob(splitURI[1])
                .split("")
                .map((stringChar) => stringChar.charCodeAt(0)),
        );

        // using a constructor for File is not recognized
        const blobType: string = splitURI[0].split(":")[1].split(";")[0];
        const tempBlob = new Blob([uint8], {
            type: blobType,
        });

        // Add missing file fields manually
        tempBlob["lastModifiedDate"] = new Date();
        tempBlob["name"] = `customLogo.${blobType.split("/")[1]}`;
        return tempBlob as File;
    }

    /**
     * Takes the branding, turns it into an observable, and adjusts the logoId of customLogo
     *
     * @param updatedBranding the branding that needs to be processed
     * @returns an observable with the preprocessed branding
     */
    private preprocessBranding(updatedBranding: DereferencedBrandingModel): Observable<DereferencedBrandingModel> {
        return of(updatedBranding).pipe(
            map((branding) => {
                if (branding.type === BrandingType.STANDARD) {
                    return branding;
                }
                // Didn't update the custom logo, just the color
                branding[FIELD_CUSTOM_LOGO].logoId = this.initialBranding[FIELD_CUSTOM_LOGO].logoId;
                return branding;
            }),
        );
    }
}
