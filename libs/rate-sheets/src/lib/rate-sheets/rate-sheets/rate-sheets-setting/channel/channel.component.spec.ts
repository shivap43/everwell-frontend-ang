import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import {
    mockNGXSRateSheetsStateService,
    mockRateSheetsComponentStoreService,
    mockSettingsDropdownComponentStore,
} from "@empowered/testing";
import { SettingsDropdownComponentStore } from "@empowered/ui";

import { ChannelComponent } from "./channel.component";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

describe("ChannelComponent", () => {
    let component: ChannelComponent;
    let fixture: ComponentFixture<ChannelComponent>;
    let ngxsRateSheetsStateService: NGXSRateSheetsStateService;
    let rateSheetsComponentStoreService: RateSheetsComponentStoreService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChannelComponent],
            providers: [
                FormBuilder,
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
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelComponent);
        component = fixture.componentInstance;
        ngxsRateSheetsStateService = TestBed.inject(NGXSRateSheetsStateService);
        rateSheetsComponentStoreService = TestBed.inject(RateSheetsComponentStoreService);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onHide()", () => {
        it("should revert FormGroup", () => {
            const spy = jest.spyOn(component, "onRevert");
            component.onHide();
            expect(spy).toBeCalled();
        });
    });

    describe("onShow()", () => {
        it("should emit onShow", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalled();
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
            const spy2 = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscriber$"], "next");
            const spy2 = jest.spyOn(component["unsubscriber$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
