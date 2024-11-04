import { ResetState } from "@empowered/user/state/actions";
import {
    BrandingModel,
    AccountService,
    DocumentApiService,
    BRANDING_UPLOAD_COMPLETE,
    BrandingColorFormat,
    LogoSize,
    BrandingType,
    FIELD_CUSTOM_LOGO,
    FIELD_STANDARD_LOGOS,
    BrokerageService,
} from "@empowered/api";
import { BrandingStateModel, DereferencedBrandingModel, StandardLogoData, AccountBranding } from "./branding-model";
import { State, StateContext, Action, createSelector } from "@ngxs/store";
import { GetBranding, LoadStandardLogoData, ResetBranding } from "./branding-action";
import { Observable, forkJoin, combineLatest } from "rxjs";
import { tap, retry, map, switchMap, first, take } from "rxjs/operators";
import { ColorControlService } from "../services/color-control/color-control.service";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";

const API_RETRY = 0;

const defaultBrandingStateModel: BrandingStateModel = {
    dereferencedBrandings: [],
    standardLogos: [],
};

export enum BrandingDomainType {
    ACCOUNT = "ACCOUNT",
    BROKERAGE = "BROKERAGE",
}

const HEX_PREFIX = "#";

@State<BrandingStateModel>({
    name: "BrandingState",
    defaults: defaultBrandingStateModel,
})
@Injectable()
export class BrandingState {
    constructor(
        private readonly accountService: AccountService,
        private readonly documentService: DocumentApiService,
        private readonly colorControl: ColorControlService,
        private readonly sanitizer: DomSanitizer,
        private readonly brokerageService: BrokerageService,
    ) {}

    /**
     * Gets all available brandings for the given type
     *
     * @param type Domain type (Account or Brokerage)
     * @param group The mp group for the account
     * @returns The selector to get the brandings
     */
    static getDereferencedBrandingList(
        type: BrandingDomainType,
        group?: number,
    ): (state: BrandingStateModel) => DereferencedBrandingModel[] {
        return createSelector([BrandingState], (state: BrandingStateModel) => {
            const brandings: AccountBranding = state.dereferencedBrandings.find(
                (branding) => branding.type === type && (type === BrandingDomainType.BROKERAGE || branding.mpGroup === group),
            );
            return brandings ? brandings.brandings : [];
        });
    }

    /**
     * Gets the latest branding for the given type
     *
     * @param type The desired domain type (Account or Brokerage)
     * @param group The mp group id fo the account
     * @param didComplete Whether the logo upload has completed or not, undefined is an option
     * @returns The selector to pull the latest branding
     */
    static getLatestBranding(
        type: BrandingDomainType,
        group?: number,
        didComplete = true,
    ): (state: BrandingStateModel) => DereferencedBrandingModel {
        // Return the selector function
        return createSelector(
            [BrandingState],
            // This function is applied to the state to get the latest branding object
            (state: BrandingStateModel) => {
                // Get the account from the state
                const account: AccountBranding = state.dereferencedBrandings.find(
                    (accountBranding) =>
                        (accountBranding.type === type && accountBranding.mpGroup === group) ||
                        (type === BrandingDomainType.BROKERAGE && accountBranding.type === type),
                );

                // If there is no account, return null
                if (!account) {
                    return null;
                }

                return (
                    account.brandings
                        // filter based off the user's input
                        .filter((branding) => {
                            if (didComplete === undefined || didComplete === null) {
                                return true;
                            }
                            const isComplete: boolean = BRANDING_UPLOAD_COMPLETE(branding);
                            return (isComplete && didComplete) || (!isComplete && !didComplete);
                        })
                        // and find the latest completed branding
                        .reduce(
                            (accumulator, branding) => (!accumulator || branding.id > accumulator.id ? branding : accumulator),
                            undefined,
                        )
                );
            },
        );
    }

    /**
     * Retrieves the preview standard logos that fits the parameters' description
     *
     * @param domainType: The domain type (ACCOUNT / BROKERAGE)
     * @param format Color format in HEX or RGB
     * @param color The color value
     * @param logoType the size of the logo (Small or Large)
     * @param identifier The mp group / undefined for domainTypes of Brokerage
     * @returns The requested logo data
     */
    static getLogoData(
        domainType: BrandingDomainType,
        format: BrandingColorFormat,
        color: string,
        logoType: LogoSize,
        identifier?: number,
    ): (state: BrandingStateModel) => SafeUrl | string {
        return createSelector([BrandingState], (state: BrandingStateModel) => {
            const logoData: StandardLogoData = state.standardLogos.find(
                (logo) =>
                    logo.domainType === domainType &&
                    (domainType === BrandingDomainType.BROKERAGE || logo.identifier === identifier) &&
                    logo.colorCode === color &&
                    logo.colorFormat === format,
            );
            return logoData ? logoData[logoType === LogoSize.SMALL ? "smallLogoData" : "largeLogoData"] : undefined;
        });
    }

    /**
     * Resets this state, used on logout
     *
     * @param context the current state context
     */
    @Action(ResetState)
    reset(context: StateContext<BrandingStateModel>): void {
        context.setState(defaultBrandingStateModel);
    }

    /**
     * Gets the Current account branding
     * @param context the current state context
     * @param param1 domainType is the input enum ACCOUNT/BROKERAGE
     * identifier defines the current group/undefined
     * forceRefresh defines if we should override existing branding
     * @returns json object as blob containing branding data
     */
    @Action(GetBranding)
    loadBranding(
        context: StateContext<BrandingStateModel>,
        { domainType, identifier, forceRefresh }: GetBranding,
    ): Observable<(Blob | [Blob, Blob])[] | (Blob | Observable<Blob>)[]> | void {
        const isDataUninitialized: boolean = this.isDataUninitialized(domainType, context, identifier);
        if (forceRefresh || isDataUninitialized) {
            // If there is no Branding on file for the group
            this.placeholderIfNoAccount(domainType, context, identifier);

            // Get the Account's branding
            return (
                domainType === BrandingDomainType.ACCOUNT
                    ? this.accountService.getAccountBrandings(identifier)
                    : this.brokerageService.getBrokerageBrandings(identifier)
            ).pipe(
                first(),
                retry(API_RETRY),
                // Fetch the document data associated with the logo IDs
                switchMap((brandings) =>
                    forkJoin(
                        brandings.map((branding) =>
                            branding.type === BrandingType.CUSTOM
                                ? // Custom branding only has the one logo
                                  this.downloadDocument(domainType, branding[FIELD_CUSTOM_LOGO].logoId).pipe(
                                      // add the logo data back into the branding
                                      tap((logoData) =>
                                          this.convertAndSaveBrandingCustomLogos(branding, domainType, logoData, context, identifier),
                                      ),
                                      map((logoData) => logoData),
                                      first(),
                                  )
                                : // Standard branding has two logos, fetch both...
                                  combineLatest(
                                      this.downloadDocument(domainType, branding[FIELD_STANDARD_LOGOS].smallLogo.logoId).pipe(
                                          retry(API_RETRY),
                                      ),
                                      this.downloadDocument(domainType, branding[FIELD_STANDARD_LOGOS].largeLogo.logoId).pipe(
                                          retry(API_RETRY),
                                      ),
                                  ).pipe(
                                      // .. and combine into a single branding object
                                      tap(([smallLogo, largeLogo]) =>
                                          this.convertAndSaveBrandingStandardLogos(
                                              branding,
                                              domainType,
                                              smallLogo,
                                              largeLogo,
                                              context,
                                              identifier,
                                          ),
                                      ),
                                      first(),
                                  ),
                        ),
                    ),
                ),
                tap(
                    (blobData) => {},
                    (error) => this.removePlaceHolderOnFailure(domainType, context, identifier),
                ),
            );
        }
    }

    /**
     * Fetch the standard logo data for the given parameters and cache it
     *
     * @param context the context to store the logo data into
     * @param loadStandardLogoData the action with the group id and color parameters
     */
    @Action(LoadStandardLogoData)
    loadStandardLogoData(context: StateContext<BrandingStateModel>, loadStandardLogoData: LoadStandardLogoData): Observable<Blob[]> | void {
        if (
            !context
                .getState()
                .standardLogos.find(
                    (standardLogo) =>
                        standardLogo.colorCode.toLowerCase() === loadStandardLogoData.colorCode.toLowerCase() &&
                        standardLogo.colorFormat === loadStandardLogoData.colorFormat &&
                        standardLogo.domainType === loadStandardLogoData.domainType &&
                        (loadStandardLogoData.domainType === BrandingDomainType.BROKERAGE ||
                            standardLogo.identifier === loadStandardLogoData.identifier),
                )
        ) {
            context.patchState({
                standardLogos: [
                    ...context.getState().standardLogos,
                    {
                        identifier: loadStandardLogoData.identifier,
                        domainType: loadStandardLogoData.domainType,
                        colorCode: loadStandardLogoData.colorCode,
                        colorFormat: loadStandardLogoData.colorFormat,
                        smallLogoData: null,
                        largeLogoData: null,
                    },
                ],
            });

            const hexColor: string = this.colorControl
                .brandingToHex(loadStandardLogoData.colorFormat, loadStandardLogoData.colorCode)
                .replace(HEX_PREFIX, "");
            return forkJoin(
                // get the logo data for the small image
                (loadStandardLogoData.domainType === BrandingDomainType.ACCOUNT
                    ? this.accountService.getAccountBrandingPreview(BrandingColorFormat.HEX, hexColor, LogoSize.SMALL)
                    : this.brokerageService.getBrokerageBrandingPreview(BrandingColorFormat.HEX, hexColor, LogoSize.SMALL)
                ).pipe(retry(API_RETRY), first()),
                // get the logo data for the large image
                (loadStandardLogoData.domainType === BrandingDomainType.ACCOUNT
                    ? this.accountService.getAccountBrandingPreview(BrandingColorFormat.HEX, hexColor, LogoSize.LARGE)
                    : this.brokerageService.getBrokerageBrandingPreview(BrandingColorFormat.HEX, hexColor, LogoSize.LARGE)
                ).pipe(retry(API_RETRY), first()),
            ).pipe(
                // Store the response into memory
                tap(([smallLogo, largeLogo]) => {
                    this.convertAndSaveStandardLogoCache(loadStandardLogoData, smallLogo, largeLogo, context);
                }),
            );
        }
    }

    /**
     * Check the given context for any branding that has been stored for the given group
     *
     * @param domainType The domain type of the branding (ACCOUNT or BROKERAGE)
     * @param context The state to check
     * @param group The mp group id to check the state for / undefined if domain type is BROKERAGE
     */
    private isDataUninitialized(domainType: BrandingDomainType, context: StateContext<BrandingStateModel>, group?: number): boolean {
        return !context
            .getState()
            .dereferencedBrandings.find(
                (groupBrandings) =>
                    groupBrandings.type === domainType && (groupBrandings.mpGroup === group || domainType === BrandingDomainType.BROKERAGE),
            );
    }

    /**
     * If there is no matching account in context, then create a placeholder to help minimize duplicate downloads
     *
     * @param domainType The domain type of the branding (ACCOUNT or BROKERAGE)
     * @param context The context to check and create the placeholder in
     * @param group The group to look in context for / undefined if domain type is BROKERAGE
     */
    private placeholderIfNoAccount(domainType: BrandingDomainType, context: StateContext<BrandingStateModel>, group?: number): void {
        const accountBranding: AccountBranding = context
            .getState()
            .dereferencedBrandings.find(
                (groupBrandings) =>
                    groupBrandings.type === domainType && (groupBrandings.mpGroup === group || domainType === BrandingDomainType.BROKERAGE),
            );
        if (!accountBranding) {
            context.patchState({
                dereferencedBrandings: [
                    ...context.getState().dereferencedBrandings,
                    {
                        type: domainType,
                        mpGroup: group,
                        brandings: [],
                    },
                ],
            });
        }
    }

    /**
     * Remove the placeholder data if there is a failure with the API call
     *
     * @param domainType The domain type of the branding (ACCOUNT or BROKERAGE)
     * @param context The context to check and create the placeholder in
     * @param group The group to look in context for / undefined if domain type is BROKERAGE
     */
    private removePlaceHolderOnFailure(domainType: BrandingDomainType, context: StateContext<BrandingStateModel>, group?: number): void {
        if (context.getState().dereferencedBrandings) {
            context.patchState({
                dereferencedBrandings: context
                    .getState()
                    .dereferencedBrandings.filter(
                        (groupBrandings) =>
                            !(
                                groupBrandings.type === domainType &&
                                (groupBrandings.mpGroup === group || domainType === BrandingDomainType.BROKERAGE) &&
                                (!groupBrandings.brandings || groupBrandings.brandings.length === 0)
                            ),
                    ),
            });
        }
    }

    /**
     * Convert the inbound logo request into a safe data url to display and store it into the cache
     *
     * @param loadStandardLogoData The request for the logo data
     * @param smallLogo The small logo data
     * @param largeLogo The large logo data
     * @param context The context to store the converted data into
     */
    private convertAndSaveStandardLogoCache(
        loadStandardLogoData: LoadStandardLogoData,
        smallLogo: Blob,
        largeLogo: Blob,
        context: StateContext<BrandingStateModel>,
    ): void {
        // Read in the blobs and convert to data url for easy comparison
        const largeReader: FileReader = new FileReader();
        largeReader.readAsDataURL(largeLogo);
        largeReader.onloadend = () => {
            // Welcome to the dark ages of JS Call-back chaining
            const smallReader: FileReader = new FileReader();
            smallReader.readAsDataURL(smallLogo);
            smallReader.onloadend = () => {
                context.patchState({
                    standardLogos: [
                        ...context
                            .getState()
                            .standardLogos.filter(
                                (standardLogo) =>
                                    !(
                                        standardLogo.colorCode === loadStandardLogoData.colorCode &&
                                        standardLogo.colorFormat === loadStandardLogoData.colorFormat &&
                                        standardLogo.identifier === loadStandardLogoData.identifier &&
                                        (loadStandardLogoData.domainType === BrandingDomainType.BROKERAGE ||
                                            standardLogo.identifier === loadStandardLogoData.identifier)
                                    ),
                            ),
                        {
                            identifier: loadStandardLogoData.identifier,
                            domainType: loadStandardLogoData.domainType,
                            colorCode: loadStandardLogoData.colorCode,
                            colorFormat: loadStandardLogoData.colorFormat,
                            smallLogoData: this.sanitizer.bypassSecurityTrustUrl(`${smallReader.result}`),
                            largeLogoData: this.sanitizer.bypassSecurityTrustUrl(`${largeReader.result}`),
                        } as StandardLogoData,
                    ],
                });
            };
        };
    }

    /**
     * Save the custom branding into the given context after transforming it into a secure data URL
     *
     * @param branding The branding the logos are for
     * @param type The domain type for the branding (ACCOUNT / BROKERAGE)
     * @param logoData The data for the custom logo
     * @param context The context to save the transformed logo data into
     * @param group The group the branding is for or undefined if the type is BROKERAGE
     */
    private convertAndSaveBrandingCustomLogos(
        branding: BrandingModel,
        type: BrandingDomainType,
        logoData: Blob,
        context: StateContext<BrandingStateModel>,
        group?: number,
    ): void {
        const reader: FileReader = new FileReader();
        reader.readAsDataURL(logoData);
        reader.onloadend = () => {
            const foundBranding: AccountBranding = context
                .getState()
                .dereferencedBrandings.find((stateAccountBranding) => stateAccountBranding.mpGroup === group);
            context.patchState({
                dereferencedBrandings: [
                    ...context.getState().dereferencedBrandings.filter((stateAccountBranding) => stateAccountBranding.mpGroup !== group),
                    {
                        type: type,
                        mpGroup: group,
                        brandings: [
                            ...(foundBranding
                                ? foundBranding.brandings.filter((existingBranding) => existingBranding.id !== branding.id)
                                : []),
                            {
                                ...branding,
                                customLogo: {
                                    ...branding[FIELD_CUSTOM_LOGO],
                                    logoData: this.sanitizer.bypassSecurityTrustUrl(`${reader.result}`),
                                },
                            } as DereferencedBrandingModel,
                        ],
                    },
                ],
            });
        };
    }

    /**
     * Save the standard branding into the given context after transforming it into a secure data URL
     *
     * @param branding The branding the logos are for
     * @param type the domain the branding belongs to
     * @param smallLogo The data for the small logo
     * @param largeLogo The data for the large logo
     * @param context The context to save the transformed logo data into
     * @param group The group the branding is for
     */
    private convertAndSaveBrandingStandardLogos(
        branding: BrandingModel,
        type: BrandingDomainType,
        smallLogo: Blob,
        largeLogo: Blob,
        context: StateContext<BrandingStateModel>,
        group?: number,
    ): void {
        // Read in the blobs and convert to data url for easy comparison
        const largeReader: FileReader = new FileReader();
        largeReader.readAsDataURL(largeLogo);
        largeReader.onloadend = () => {
            // Welcome to the dark ages of JS Call-back chaining
            const smallReader: FileReader = new FileReader();
            smallReader.readAsDataURL(smallLogo);
            smallReader.onloadend = () => {
                const foundBranding: AccountBranding = context
                    .getState()
                    .dereferencedBrandings.find((stateAccountBranding) => stateAccountBranding.mpGroup === group);
                context.patchState({
                    dereferencedBrandings: [
                        ...context
                            .getState()
                            .dereferencedBrandings.filter((stateAccountBranding) => stateAccountBranding.mpGroup !== group),
                        {
                            type: type,
                            mpGroup: group,
                            brandings: [
                                ...(foundBranding
                                    ? foundBranding.brandings.filter((existingBranding) => existingBranding.id !== branding.id)
                                    : []),
                                {
                                    ...branding,
                                    standardLogos: {
                                        smallLogo: {
                                            ...branding[FIELD_STANDARD_LOGOS].smallLogo,
                                            logoData: this.sanitizer.bypassSecurityTrustUrl(`${largeReader.result}`),
                                        },
                                        largeLogo: {
                                            ...branding[FIELD_STANDARD_LOGOS].largeLogo,
                                            logoData: this.sanitizer.bypassSecurityTrustUrl(`${smallReader.result}`),
                                        },
                                    },
                                } as DereferencedBrandingModel,
                            ],
                        },
                    ],
                });
            };
        };
    }

    /**
     * Reset the branding depends on the group Id
     * @param context The context to save the update data
     * @param group  The GroupId for which branding want to reset.
     * @return Observable of type HttpResponse
     */
    @Action(ResetBranding)
    resetBranding(context: StateContext<BrandingStateModel>, { domainType, group }: ResetBranding): Observable<HttpResponse<unknown>> {
        return (
            domainType === BrandingDomainType.ACCOUNT
                ? this.accountService.resetAccountBranding()
                : this.brokerageService.resetBrokerageBranding()
        ).pipe(
            tap((result) =>
                context.patchState({
                    dereferencedBrandings: [
                        ...context.getState().dereferencedBrandings.filter(
                            // Filtering the state account branding depends on the group
                            (branding) =>
                                (domainType === BrandingDomainType.ACCOUNT &&
                                    (branding.type !== domainType || branding.mpGroup !== group)) ||
                                (domainType === BrandingDomainType.BROKERAGE && branding.type !== BrandingDomainType.BROKERAGE),
                        ),
                    ],
                }),
            ),
            take(1),
        );
    }

    /**
     * Call the correct download endpoint to pull down a document's data
     *
     * @param domainType The domain type of the Branding Domain
     * @param documentId The document ID to download
     * @returns The correct endpoint to call with retry logic
     */
    private downloadDocument(domainType: BrandingDomainType, documentId: number): Observable<Blob> {
        return (
            domainType === BrandingDomainType.ACCOUNT
                ? this.documentService.downloadDocument(documentId)
                : this.brokerageService.downloadBrokerageDocument(documentId)
        ).pipe(retry(API_RETRY));
    }
}
