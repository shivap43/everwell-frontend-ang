import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockMatDialogRef } from "@empowered/testing";

import { AgAiOfferingSetupAlertComponent } from "./ag-ai-offering-setup-alert.component";

describe("TestComponent", () => {
    let component: AgAiOfferingSetupAlertComponent;
    let fixture: ComponentFixture<AgAiOfferingSetupAlertComponent>;
    let matdialogRef: MatDialogRef<AgAiOfferingSetupAlertComponent>;
    let languageService: LanguageService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AgAiOfferingSetupAlertComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AgAiOfferingSetupAlertComponent);
        component = fixture.componentInstance;
        matdialogRef = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should get primary language strings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.ngOnInit();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("onSubmitOffering()", () => {
        it("should called when clicked on submit button", () => {
            const spy = jest.spyOn(matdialogRef, "close");
            component.onSubmitOffering();
            expect(spy).toBeCalledWith(true);
        });
    });
    describe("onNavigateToIBO()", () => {
        it("should called when click of add non-ag plans", () => {
            const spy = jest.spyOn(matdialogRef, "close");
            component.onNavigateToIBO();
            expect(spy).toBeCalledWith(false);
        });
    });
});
