import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import {
    mockNGXSRateSheetsStateService,
    mockRateSheetsComponentStoreService,
    mockSettingsDropdownComponentStore,
} from "@empowered/testing";
import { SettingsDropdownComponentStore } from "@empowered/ui";
import { JobClassComponent } from "./job-class.component";
import { NGXSRateSheetsStateService } from "../../ngxs-rate-sheets-state/ngxs-rate-sheets-state.service";
import { RateSheetsComponentStoreService } from "../../rate-sheets-component-store/rate-sheets-component-store.service";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";

describe("JobClassComponent", () => {
    let component: JobClassComponent;
    let fixture: ComponentFixture<JobClassComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JobClassComponent],
            imports: [ReactiveFormsModule],
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
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JobClassComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onShow()", () => {
        it("should show", () => {
            const spy = jest.spyOn(component["onShow$"], "next");
            component.onShow();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onHide()", () => {
        it("should call onRevert()", () => {
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

    describe("onRevert()", () => {
        it("should revert", () => {
            const spy = jest.spyOn(component["onRevert$"], "next");
            component.onRevert();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onReset()", () => {
        it("should reset", () => {
            const spy = jest.spyOn(component["onReset$"], "next");
            component.onReset();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyNext = jest.spyOn(component["unsubscriber$"], "next");
            const spyComplete = jest.spyOn(component["unsubscriber$"], "complete");
            fixture.destroy();
            expect(spyNext).toBeCalledTimes(1);
            expect(spyComplete).toBeCalledTimes(1);
        });
    });
});
