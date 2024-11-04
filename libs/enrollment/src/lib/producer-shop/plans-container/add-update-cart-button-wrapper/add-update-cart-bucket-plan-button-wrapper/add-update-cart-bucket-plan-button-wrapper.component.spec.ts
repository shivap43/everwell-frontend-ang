import { ComponentType } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { PlanOfferingWithCartAndEnrollment, PlanOffering } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { ManageCartItemsHelperService } from "../../../services/manage-cart-items/manage-cart-items-helper.service";
import { ProducerShopComponentStoreService } from "../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { RiderComponentStoreService } from "../../../services/rider-component-store/rider-component-store.service";
import { AddUpdateCartButtonState } from "../add-update-cart-button-wrapper.model";

import { AddUpdateCartBucketPlanButtonWrapperComponent } from "./add-update-cart-bucket-plan-button-wrapper.component";
const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(null),
        } as MatDialogRef<any>),
} as MatDialog;
const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;
class MockAddUpdateCartButtonWrapperComponent {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;
}

describe("AddUpdateCartBucketPlanButtonWrapperComponent", () => {
    let component: AddUpdateCartBucketPlanButtonWrapperComponent;
    let fixture: ComponentFixture<AddUpdateCartBucketPlanButtonWrapperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddUpdateCartBucketPlanButtonWrapperComponent],
            imports: [HttpClientTestingModule, RouterTestingModule, NgxsModule.forRoot([])],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                DatePipe,
                ManageCartItemsHelperService,
                ProducerShopComponentStoreService,
                RiderComponentStoreService,
                MockAddUpdateCartButtonWrapperComponent,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddUpdateCartBucketPlanButtonWrapperComponent);
        component = fixture.componentInstance;
        component.planPanel = {
            planOffering: {
                id: 999,
                plan: {
                    id: 777,
                    product: {
                        id: 888,
                    },
                },
            } as PlanOffering,
        };
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should return the ADD_TO_CART state for addUpdateButton", () => {
        const planOfferingWithCartAndEnrollment = {
            planOffering: {
                id: 999,
                plan: {
                    id: 777,
                    product: {
                        id: 888,
                    },
                },
            },
        } as PlanOfferingWithCartAndEnrollment;
        const isShoppingCartLocked = false;
        const disableAddCart = false;
        const isCartDataChanged = false;
        const addUpdateCartButtonStateEnum = AddUpdateCartButtonState;
        expect(
            component.getAddUpdateCartButtonStatus(
                planOfferingWithCartAndEnrollment,
                isShoppingCartLocked,
                disableAddCart,
                isCartDataChanged,
            ),
        ).toStrictEqual({ addUpdateCartButtonState: addUpdateCartButtonStateEnum.ADD_TO_CART, isDisabled: false, toolTipText: null });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscriber$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscriber$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
