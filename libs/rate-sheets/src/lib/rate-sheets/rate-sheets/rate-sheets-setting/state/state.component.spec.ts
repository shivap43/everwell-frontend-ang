import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import {
    mockNGXSRateSheetsStateService,
    mockRateSheetsComponentStoreService,
    mockSettingsDropdownComponentStore,
    mockUtilService,
} from "@empowered/testing";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { StateComponent } from "./state.component";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { AsyncStatus } from "@empowered/constants";
import { UtilService } from "@empowered/ngxs-store";
import { of } from "rxjs";
import { RateSheetMoreSettings } from "../../rate-sheets-component-store/rate-sheets-component-store.model";

describe("StateComponent", () => {
    let component: StateComponent;
    let fixture: ComponentFixture<StateComponent>;
    let rateSheetsComponentStoreService: RateSheetsComponentStoreService;
    let utilService: UtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [StateComponent],
            imports: [ReactiveFormsModule],
            providers: [
                FormBuilder,
                NGRXStore,
                provideMockStore({}),
                {
                    provide: SettingsDropdownComponentStore,
                    useValue: mockSettingsDropdownComponentStore,
                },
                {
                    provide: NGXSRateSheetsStateService,
                    useValue: mockNGXSRateSheetsStateService,
                },
                {
                    provide: RateSheetsComponentStoreService,
                    useValue: mockRateSheetsComponentStoreService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(StateComponent);
        component = fixture.componentInstance;
        rateSheetsComponentStoreService = TestBed.inject(RateSheetsComponentStoreService);
        utilService = TestBed.inject(UtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should revert FormGroup", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onApply()", () => {
        it("should mark form as touched", () => {
            const spy = jest.spyOn(component.form, "markAllAsTouched");
            component.onApply();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("updateMoreSettingsZipField()", () => {
        it("should get MoreSettings values from ComponentStore", (done) => {
            const mockValue = {
                zipCode: "28205",
                sicCode: 3,
                eligibleSubscribers: 25,
            } as RateSheetMoreSettings;
            const spy1 = jest.spyOn(rateSheetsComponentStoreService, "selectMoreSettingsOnAsyncValue").mockReturnValue(of(mockValue));
            component.updateMoreSettingsZipField("GA");
            rateSheetsComponentStoreService.selectMoreSettingsOnAsyncValue().subscribe((value) => {
                expect.assertions(2);
                expect(value).toStrictEqual(mockValue);
                done();
            });
            expect(spy1).toBeCalled();
        });
        it("should set the MoreSettings values when selected state and zip value doesn't match", () => {
            const mockValue = {
                zipCode: "28205",
                sicCode: 3,
                eligibleSubscribers: 25,
            } as RateSheetMoreSettings;
            const spy1 = jest.spyOn(rateSheetsComponentStoreService, "selectMoreSettingsOnAsyncValue").mockReturnValue(of(mockValue));
            component.updateMoreSettingsZipField("GA");
            const spy = jest.spyOn(utilService, "validateZip").mockReturnValue(of(false));
            const spy2 = jest.spyOn(rateSheetsComponentStoreService, "setMoreSettings");
            component.updateMoreSettingsZipField("GA");
            expect(spy).toBeCalledWith("GA", "28205");
            expect(spy2).toBeCalledWith({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    zipCode: "",
                    sicCode: 3,
                    eligibleSubscribers: 25,
                },
                error: null,
            });
        });
    });

    describe("onRevert()", () => {
        it("should emit onRevert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onReset()", () => {
        it("should reset FormGroup", () => {
            const spy = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscriber$"], "next");
            const spyComplete = jest.spyOn(component["unsubscriber$"], "complete");
            component.ngOnDestroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
