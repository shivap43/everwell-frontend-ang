import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { CoverageLevelComponent } from "./coverage-level.component";
import { LanguageService } from "@empowered/language";
import { mockLanguageService } from "@empowered/testing";

@Component({
    selector: "empowered-host-component",
    template: "<empowered-coverage-level [formControl]='formControl' [coverageLevels]='coverages'></empowered-coverage-level>",
})
class TestHostComponent {
    @ViewChild(CoverageLevelComponent) coverageLevelComponent: CoverageLevelComponent;
    formControl = new FormControl([]);
    coverages = [];
}

describe("CoverageLevelComponent", () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CoverageLevelComponent, TestHostComponent],
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
        expect(component.coverageLevelComponent).toBeTruthy();
    });

    describe("Control Value Accessor", () => {
        it("should propagate the initial value from the model to the view", () => {
            expect(component.coverageLevelComponent.formControl.value).toStrictEqual([]);
        });

        it("should propagate values from the model to the view", () => {
            component.formControl.setValue([
                { id: 102, name: "Individual" },
                { id: 103, name: "One Parent Family" },
            ]);
            expect(component.coverageLevelComponent.formControl.value).toStrictEqual([
                { id: 102, name: "Individual" },
                { id: 103, name: "One Parent Family" },
            ]);
        });
    });

    describe("ngOnInit()", () => {
        it("should initialize coverage level component", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.coverageLevelComponent.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component.coverageLevelComponent["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component.coverageLevelComponent["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
