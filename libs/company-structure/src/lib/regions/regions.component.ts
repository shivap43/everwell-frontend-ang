import { Component, OnInit, OnDestroy } from "@angular/core";
import { PortalsService } from "../portals.service";
import { Observable, of, defer, Subscription, forkJoin } from "rxjs";
import { RegionType, Region, RegionTypeDisplay, AccountProfileService, RegionNames, LanguageModel } from "@empowered/api";
import { map, take, flatMap, catchError, finalize } from "rxjs/operators";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { ActionType } from "../shared/models/container-data-model";
import { RegionTypeDetails } from "../shared/models/region-type-details.model";
import { Store } from "@ngxs/store";
import { SharedService } from "@empowered/common-services";
import { ActivatedRoute } from "@angular/router";
import { LanguageService, LanguageState } from "@empowered/language";
import { ClientErrorResponseCode, PagePrivacy, AppSettings } from "@empowered/constants";
import { SharedState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-regions",
    templateUrl: "./regions.component.html",
    styleUrls: ["./regions.component.scss"],
})
export class RegionsComponent implements OnInit, OnDestroy {
    regionTypesDisplay: { regionType: RegionTypeDisplay; regions: RegionNames[] }[];
    errorCode: string;
    oldDefaultRegionType: RegionTypeDisplay;
    MpGroup: number;
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    isInvalidZip = false;
    isLoading: boolean;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    actionSubscription: Subscription;
    showErrorMessage = false;
    errorMessage: string;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues(["primary.portal.regions.region"]);
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;

    constructor(
        private readonly portalsService: PortalsService,
        private readonly accountProfileService: AccountProfileService,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly sharedService: SharedService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_STRUCTURE);
        }
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.portalsService.zeroStateForRegions = false;
        this.MpGroup = this.route.parent.parent.snapshot.params.mpGroupId;
        this.accountProfileService
            .getRegionTypes(this.MpGroup)
            .pipe(
                take(1),
                flatMap((regionTypeArray) =>
                    regionTypeArray && regionTypeArray.length === 0
                        ? of([])
                        : forkJoin(regionTypeArray.map((regionType) => this.pipeTranformRegionType(of(regionType)))),
                ),
                catchError((httpErrorResponse: HttpErrorResponse) => {
                    this.errorCode = `getRegionTypes.${httpErrorResponse.error.code}`;
                    this.isLoading = false;
                    return of(null);
                }),
            )
            .subscribe((transformedArray) => {
                this.isLoading = false;
                if (transformedArray && transformedArray.length === 0) {
                    this.portalsService.zeroStateForRegions = true;
                }
                this.regionTypesDisplay = transformedArray;
            });
        this.actionSubscription = this.portalsService.action$.subscribe(this.handleAction);
    }
    handleAction = (actionObject) => {
        switch (actionObject.action) {
            case ActionType.region_type_create:
                this.createRegionType(actionObject.data)
                    .pipe(take(1))
                    .subscribe((createdRegionType) => {
                        this.regionTypesDisplay.push(createdRegionType);
                        this.portalsService.detachPortal();
                        if (this.regionTypesDisplay.length > 0) {
                            this.portalsService.zeroStateForRegions = false;
                        }
                    });
                break;
            case ActionType.region_type_update:
                this.updateRegionType(actionObject.data)
                    .pipe(take(1))
                    .subscribe((regionTypeGet) => {
                        this.editInPlace(regionTypeGet);
                        this.portalsService.detachPortal();
                    });
                break;
            case ActionType.region_update:
                this.updateRegion(actionObject.data)
                    .pipe(take(1))
                    .subscribe((createdRegionType) => {
                        if (createdRegionType && createdRegionType.regionType) {
                            const index = this.regionTypesDisplay.findIndex(
                                (regionTypesDisplayObj) => regionTypesDisplayObj.regionType.id === createdRegionType.regionType.id,
                            );
                            this.regionTypesDisplay[index] = createdRegionType;
                            this.portalsService.detachPortal();
                        }
                    });

                break;
            case ActionType.region_type_remove:
                this.deleteRegionType(actionObject.data.regionTypeId)
                    .pipe(take(1))
                    .subscribe(() => {
                        this.regionTypesDisplay = this.regionTypesDisplay.filter(
                            (regionTypesDisplayObj) => regionTypesDisplayObj.regionType.id !== actionObject.data.regionTypeId,
                        );
                        if (this.regionTypesDisplay.length === 0) {
                            this.portalsService.zeroStateForRegions = true;
                        }
                        actionObject.data.panel.close();
                    });
                break;
            case ActionType.region_remove:
                this.deleteRegion(actionObject.data)
                    .pipe(take(1))
                    .subscribe((regionTypeGet) => {
                        this.editInPlace(regionTypeGet);
                        actionObject.data.panel.close();
                    });
                break;

            case ActionType.region_create:
                this.createRegion(actionObject.data)
                    .pipe(take(1))
                    .subscribe((createdRegionType) => {
                        if (createdRegionType && createdRegionType.regionType) {
                            const index = this.regionTypesDisplay.findIndex(
                                (regionTypesDisplayObj) => regionTypesDisplayObj.regionType.id === createdRegionType.regionType.id,
                            );
                            this.regionTypesDisplay[index] = createdRegionType;
                            this.portalsService.detachPortal();
                        }
                    });
                break;
        }
    };
    createRegionType(data: RegionType): Observable<RegionTypeDetails> {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.createRegionType(data, this.MpGroup).pipe(
                flatMap((httpResponse) => {
                    switch (httpResponse.status) {
                        case AppSettings.API_RESP_201:
                            // eslint-disable-next-line no-case-declarations
                            const regionTypeId = httpResponse.headers.get("location").split("/").slice(-1);
                            return this.getRegionType(+regionTypeId);
                        default:
                            return of(null);
                    }
                }),
                catchError((httpErrorResponse: HttpErrorResponse) => {
                    this.errorCode = `getRegionType.${httpErrorResponse.error.code}`;
                    return of(null);
                }),
                finalize(() => (this.isLoading = false)),
            );
        });
    }
    getRegionType(regionTypeId: number): Observable<RegionTypeDetails> {
        return defer(() => {
            this.isLoading = true;
            return this.pipeTranformRegionType(this.accountProfileService.getRegionType(regionTypeId, this.MpGroup)).pipe(
                catchError((httpErrorResponse: HttpErrorResponse) => {
                    this.errorCode = `getRegionType.${httpErrorResponse.error.code}`;
                    return of(null);
                }),
                finalize(() => (this.isLoading = false)),
            );
        });
    }
    // TODO: Remove hardcoded MP-Group
    pipeTranformRegionType(source: Observable<RegionType>): Observable<RegionTypeDetails> {
        return source.pipe(
            map((regionType) => Object.assign({}, { regionType: regionType, regions: null })),
            flatMap((regionTypeResponse) =>
                this.accountProfileService.getRegions(regionTypeResponse.regionType.id, this.MpGroup).pipe(
                    map((regions) => regions.filter((region) => !region.default || region.numberOfMembers > 0)),
                    map((obj) => Object.assign(regionTypeResponse, { regions: obj })),
                    map((obj) => {
                        const totalNumberOfMembers = obj.regions
                            .map((regionName) => regionName.numberOfMembers)
                            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                        const defaultRegionForType = obj.regions.filter((klass) => klass.default)[0];
                        const regionTypeNew = Object.assign({}, obj.regionType, {
                            totalNumberOfMembers: totalNumberOfMembers,
                            defaultRegion: defaultRegionForType,
                        });
                        return Object.assign(obj, { regionType: regionTypeNew });
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => {
                        this.errorCode = `getRegionType.${httpErrorResponse.error}`;
                        return of(null);
                    }),
                ),
            ),
        );
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    updateRegion(payload: { updateRegionReq: object; regionTypeId: number; regionId: number }): Observable<RegionTypeDetails> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService
                .updateRegion(payload.updateRegionReq as Region, payload.regionTypeId, payload.regionId, this.MpGroup)
                .pipe(
                    flatMap((httpResponse) => {
                        switch (httpResponse.status) {
                            case AppSettings.API_RESP_204:
                                return this.getRegionType(+payload.regionTypeId);
                        }
                        return undefined;
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => {
                        this.errorCode = `getRegionType.${httpErrorResponse.error.code}`;
                        this.showErrorAlertMessage(httpErrorResponse);
                        return of(null);
                    }),
                    finalize(() => (this.isLoading = false)),
                );
        });
    }
    // this removes null keys from any generic object
    // eslint-disable-next-line @typescript-eslint/ban-types
    ignoreNullKeys(form: object): any {
        for (const key in form) {
            if (!form[key]) {
                delete form[key];
            }
        }
        return form;
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    updateRegionType(payload: { updateRegionTypeReq: object; regionTypeId: number }): Observable<RegionTypeDetails> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService
                .updateRegionType(this.ignoreNullKeys(payload.updateRegionTypeReq), payload.regionTypeId, this.MpGroup)
                .pipe(
                    flatMap((httpResponse) => {
                        switch (httpResponse.status) {
                            case AppSettings.API_RESP_204:
                                return this.getRegionType(+payload.regionTypeId);
                        }
                        return undefined;
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => {
                        this.errorCode = `getRegionType.${httpErrorResponse.error}`;
                        return of(null);
                    }),
                    finalize(() => (this.isLoading = false)),
                );
        });
    }
    editInPlace(regionTypeDetails: RegionTypeDetails): void {
        const index = this.regionTypesDisplay.findIndex(
            (regionTypesDisplayObj) => regionTypesDisplayObj.regionType.id === regionTypeDetails.regionType.id,
        );
        this.regionTypesDisplay[index] = regionTypeDetails;
    }
    deleteRegionType(regionTypeId: number): Observable<HttpResponse<void>> {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.deleteRegionType(+regionTypeId, this.MpGroup).pipe(
                catchError((httpErrorResponse: HttpErrorResponse) => {
                    this.errorCode = `getRegionType.${httpErrorResponse.error}`;
                    return of(null);
                }),
                finalize(() => (this.isLoading = false)),
            );
        });
    }
    deleteRegion(payload: { regionTypeId: number; regionId: number }): Observable<RegionTypeDetails> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.deleteRegion(payload.regionTypeId, payload.regionId, this.MpGroup).pipe(
                flatMap((httpResponse) => {
                    switch (httpResponse.status) {
                        case AppSettings.API_RESP_204:
                            return this.getRegionType(+payload.regionTypeId);
                    }
                    return undefined;
                }),
                catchError((httpErrorResponse: HttpErrorResponse) => {
                    this.errorCode = `getRegionType.${httpErrorResponse.error}`;
                    return of(null);
                }),
                finalize(() => (this.isLoading = false)),
            );
        });
    }
    createRegion(payload: {
        createRegionReq: Region;
        regionTypeId: number;
    }): Observable<{ regionType: RegionTypeDisplay; regions: RegionNames[] }> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.createRegion(payload.createRegionReq, payload.regionTypeId, this.MpGroup).pipe(
                flatMap((httpResponse) => {
                    switch (httpResponse.status) {
                        case AppSettings.API_RESP_201:
                            // eslint-disable-next-line no-case-declarations
                            const regionTypeId = httpResponse.headers.get("location").split("/").slice(-3)[0];
                            return this.getRegionType(+regionTypeId);
                    }
                    return undefined;
                }),
                catchError((httpErrorResponse: HttpErrorResponse) => {
                    this.errorCode = `getRegionType.${httpErrorResponse.error.code}`;
                    this.showErrorAlertMessage(httpErrorResponse);
                    return of(null);
                }),
                finalize(() => (this.isLoading = false)),
            );
        });
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[this.ERROR];
        const COMPOSITION_RANGE = "composition.ranges";
        if (error.status === ClientErrorResponseCode.RESP_400 && error.details.length > 0) {
            const detailObject = error.details[0];
            if (
                detailObject.field === COMPOSITION_RANGE &&
                (detailObject.code === "invalid_postal_code" ||
                    detailObject.code === "existing_postal_code" ||
                    detailObject.code === "existing_state_postal_code")
            ) {
                {
                    this.isInvalidZip = true;
                    const errorZipObj = {
                        valid: this.isInvalidZip,
                        type: COMPOSITION_RANGE,
                        code: detailObject.code,
                    };
                    this.portalsService.setInvalidZipStatus(errorZipObj);
                }
            }
            if (detailObject.field === "composition.states") {
                this.isInvalidZip = true;
                const errorZipObj = {
                    valid: this.isInvalidZip,
                    type: "composition.states",
                    numberOfState: error.details.length,
                };
                this.portalsService.setInvalidZipStatus(errorZipObj);
            }
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
            this.showErrorMessage = true;
        }
    }
    ngOnDestroy(): void {
        this.actionSubscription.unsubscribe();
    }
}
