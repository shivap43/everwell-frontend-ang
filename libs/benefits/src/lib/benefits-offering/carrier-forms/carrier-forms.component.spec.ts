import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { CarrierFormsComponent } from "./carrier-forms.component";
import { LanguageService } from "@empowered/language";
import { MatDialog } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { AccountInfoState, AccountListState, BenefitsOfferingState, StaticUtilService } from "@empowered/ngxs-store";
import { GroupAttributeEnum } from "@empowered/constants";
import { mockLanguageService, mockMatDialog, mockStaticUtilService } from "@empowered/testing";
import { StoreModule } from "@ngrx/store";

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal",
})
class MockModalComponent {
    @Input() showCancel: boolean;
}

@Component({
    template: "",
    selector: "empowered-modal-header",
})
class MockModalHeaderComponent {}

@Component({
    template: "",
    selector: "empowered-modal-footer",
})
class MockModalFooterComponent {}

describe("CarrierFormsComponent", () => {
    let component: CarrierFormsComponent;
    let fixture: ComponentFixture<CarrierFormsComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CarrierFormsComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockModalFooterComponent,
                MockMonSpinnerComponent,
            ],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                DatePipe,
                RouterTestingModule,
            ],
            imports: [
                NgxsModule.forRoot([BenefitsOfferingState, AccountInfoState, AccountListState]),
                HttpClientTestingModule,
                RouterTestingModule,
                StoreModule.forRoot({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            productOffering: {
                offeringSteps: {},
            },
            accountInfo: {
                accountInfo: {
                    situs: {
                        state: {},
                    },
                },
            },
            accounts: {
                selectedGroup: {
                    id: 1,
                },
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CarrierFormsComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("filterIsNotDefaultSIC()", () => {
        it("should return true if attributes do not contain IS_DEFAULT_SIC_CODE attribute", () => {
            const attributes = [{ attribute: "" }];
            expect(component.filterIsNotDefaultSIC(attributes)).toBeTruthy();
        });
        it("should return true if attribute IS_DEFAULT_SIC_CODE has value 'false'", () => {
            const attributes = [{ attribute: GroupAttributeEnum.IS_DEFAULT_SIC_CODE, value: "false" }];
            expect(component.filterIsNotDefaultSIC(attributes)).toBeTruthy();
        });
        it("should return false if attribute IS_DEFAULT_SIC_CODE is not false 'false'", () => {
            const attributes = [{ attribute: GroupAttributeEnum.IS_DEFAULT_SIC_CODE, value: "true" }];
            expect(component.filterIsNotDefaultSIC(attributes)).toBeFalsy();
        });
    });

    describe("isSitusNyRSLI()", () => {
        it("should return true if situs state is NY and Carrier is RSLI", () => {
            component.isSitusState = true;
            expect(component.isSitusNyRSLI(60)).toBeTruthy();
        });
        it("should return false if situs state is NY and Carrier is not RSLI", () => {
            component.isSitusState = true;
            expect(component.isSitusNyRSLI(1)).toBeFalsy();
        });
        it("should return false if situs state is not NY and Carrier is RSLI", () => {
            component.isSitusState = false;
            expect(component.isSitusNyRSLI(60)).toBeFalsy();
        });
        it("should return false if situs state is not NY and Carrier is not RSLI", () => {
            component.isSitusState = false;
            expect(component.isSitusNyRSLI(1)).toBeFalsy();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
