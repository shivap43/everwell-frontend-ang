import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { EliminationPeriodComponent } from "./elimination-period.component";
import { LanguageService } from "@empowered/language";
import { mockLanguageService } from "@empowered/testing";

@Component({
    selector: "empowered-host-component",
    template:
        "<empowered-elimination-period [formControl]='formControl' [eliminationPeriods]='eliminationOptions'></empowered-elimination-period>",
})
class TestHostComponent {
    @ViewChild(EliminationPeriodComponent) eliminationPeriodComponent: EliminationPeriodComponent;
    formControl = new FormControl([]);
    eliminationOptions = [];
}

describe("EliminationPeriodComponent", () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EliminationPeriodComponent, TestHostComponent],
            providers: [NGRXStore, provideMockStore({}), { provide: LanguageService, useValue: mockLanguageService }],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        languageService = TestBed.inject(LanguageService);
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(component.eliminationPeriodComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should propagate the initial value from the model to the view", () => {
            expect(component.eliminationPeriodComponent.formControl.value).toStrictEqual([]);
        });

        it("should propagate values from the model to the view", () => {
            component.formControl.setValue([
                { id: 102, name: "7/7 days" },
                { id: 103, name: "7/14 days" },
            ]);
            expect(component.eliminationPeriodComponent.formControl.value).toStrictEqual([
                { id: 102, name: "7/7 days" },
                { id: 103, name: "7/14 days" },
            ]);
        });
    });

    describe("ngOnInit()", () => {
        it("should initialize elimination period component", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.eliminationPeriodComponent.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component.eliminationPeriodComponent["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component.eliminationPeriodComponent["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
