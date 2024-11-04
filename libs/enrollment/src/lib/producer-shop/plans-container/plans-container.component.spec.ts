import { ComponentType } from "@angular/cdk/portal";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute, Params } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { of, Subject } from "rxjs";

import { ProducerShopComponentStoreService } from "../services/producer-shop-component-store/producer-shop-component-store.service";
import { PlansContainerComponent } from "./plans-container.component";
import { RiderComponentStoreService } from "../services/rider-component-store/rider-component-store.service";
import { AgeService } from "../services/age/age.service";
import { DependentAgeService } from "../services/dependent-age/dependent-age.service";
import { TpiRestrictionsHelperService } from "../services/tpi-restriction-helper/tpi-restrictions-helper.service";

import {
    CarrierId,
    Characteristics,
    TaxStatus,
    PlanType,
    Plan,
    PlanOffering,
    Product,
    ProductOffering,
    PlanOfferingWithCartAndEnrollment,
    CombinedOfferingWithCartAndEnrollment,
} from "@empowered/constants";
import { mockPlanPanelService, MockReplaceTagPipe } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PlanPanelService } from "../services/plan-panel/plan-panel.service";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

const mockRouteParams = new Subject<Params>();

const mockRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;

const mockTpiRestrictionsHelperService = {
    isDependentRequiredForJuvenile: () => of(false),
} as TpiRestrictionsHelperService;

@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("PlansContainerComponent", () => {
    let component: PlansContainerComponent;
    let fixture: ComponentFixture<PlansContainerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlansContainerComponent, MockReplaceTagPipe, MockLanguageDirective, MockRichTooltipDirective],
            providers: [
                AgeService,
                NGRXStore,
                provideMockStore({}),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: TpiRestrictionsHelperService,
                    useValue: mockTpiRestrictionsHelperService,
                },
                ProducerShopComponentStoreService,
                RiderComponentStoreService,
                DependentAgeService,
                {
                    provide: PlanPanelService,
                    useValue: mockPlanPanelService,
                },
            ],
            imports: [RouterTestingModule, HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlansContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onPlanSelection()", () => {
        /* // NOTE: skip due to private producerShopHelperService
        it("should set selected plan to store on selection", () => {
            // NOTE: need to remove private for producerShopHelperService on component to test
            const spy1 = jest.spyOn(component.producerShopHelperService, "setSelectedPlanDataToStore");
            const planOfferingWithCartAndEnrollment = {
                planOffering: {
                    id: 555,
                    taxStatus: TaxStatus.POSTTAX,
                    productOfferingId: 11,
                    plan: {
                        carrierId: CarrierId.AFLAC,
                        characteristics: [] as Characteristics[],
                        product: { id: 8 } as Product,
                    } as Plan,
                } as PlanOffering,
            } as PlanOfferingWithCartAndEnrollment;
            component.onPlanSelection(planOfferingWithCartAndEnrollment);
            expect(spy1).toBeCalled();
        });
        */
    });

    describe("isAllAutoEnrolledOrRedirectPlans()", () => {
        it("should return true if all plans are auto enrolled or redirect plans", () => {
            const combinedOffering = {
                productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                planOfferingsWithCartAndEnrollment: [
                    {
                        planOffering: {
                            id: 555,
                            taxStatus: TaxStatus.POSTTAX,
                            productOfferingId: 11,
                            plan: {
                                carrierId: CarrierId.AFLAC,
                                characteristics: [] as Characteristics[],
                                product: { id: 8 } as Product,
                            } as Plan,
                            type: PlanType.REDIRECT,
                        } as PlanOffering,
                    },
                    {
                        planOffering: {
                            id: 556,
                            taxStatus: TaxStatus.POSTTAX,
                            productOfferingId: 11,
                            plan: {
                                carrierId: CarrierId.AFLAC,
                                characteristics: [Characteristics.AUTOENROLLABLE] as Characteristics[],
                                product: { id: 8 } as Product,
                            } as Plan,
                        } as PlanOffering,
                    },
                ] as PlanOfferingWithCartAndEnrollment[],
            } as CombinedOfferingWithCartAndEnrollment;
            expect(component.isAllAutoEnrolledOrRedirectPlans(combinedOffering)).toBe(true);
        });

        it("should return false if not all plans are auto enrolled or redirect plans", () => {
            const combinedOffering = {
                productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                planOfferingsWithCartAndEnrollment: [
                    {
                        planOffering: {
                            id: 555,
                            taxStatus: TaxStatus.POSTTAX,
                            productOfferingId: 11,
                            plan: {
                                carrierId: CarrierId.AFLAC,
                                characteristics: [] as Characteristics[],
                                product: { id: 8 } as Product,
                            } as Plan,
                        } as PlanOffering,
                    },
                    {
                        planOffering: {
                            id: 556,
                            taxStatus: TaxStatus.POSTTAX,
                            productOfferingId: 11,
                            plan: {
                                carrierId: CarrierId.AFLAC,
                                characteristics: [Characteristics.AUTOENROLLABLE] as Characteristics[],
                                product: { id: 8 } as Product,
                            } as Plan,
                        } as PlanOffering,
                    },
                ] as PlanOfferingWithCartAndEnrollment[],
            } as CombinedOfferingWithCartAndEnrollment;
            expect(component.isAllAutoEnrolledOrRedirectPlans(combinedOffering)).toBe(false);
        });
    });

    describe("getLanguageStrings()", () => {
        it("should get language strings", () => {
            expect(component.languageStrings).toBeTruthy();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscriber$"], "next");
            const spy2 = jest.spyOn(component["unsubscriber$"], "complete");
            fixture.destroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
