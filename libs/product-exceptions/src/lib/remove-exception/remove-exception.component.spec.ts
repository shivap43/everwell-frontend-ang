import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ExceptionsService } from "@empowered/api";
import { DateService } from "@empowered/date";
import { LanguageService } from "@empowered/language";
import { mockExceptionsService, mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { RemoveExceptionComponent } from "./remove-exception.component";
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from "@angular/core";

const mockMatDialogData = {
    mpGroup: 111,
    isVasException: true,
};

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

describe("RemoveExceptionComponent", () => {
    let component: RemoveExceptionComponent;
    let fixture: ComponentFixture<RemoveExceptionComponent>;
    let mockDialogRef: MatDialogRef<RemoveExceptionComponent>;
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RemoveExceptionComponent, MockReplaceTagPipe],
            imports: [ReactiveFormsModule],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: ExceptionsService,
                    useValue: mockExceptionsService,
                },
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                DateService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RemoveExceptionComponent);
        component = fixture.componentInstance;
        mockDialogRef = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize the component", () => {
            const spy1 = jest.spyOn(component, "fetchLanguageData");
            const spy2 = jest.spyOn(component, "getException");
            component.ngOnInit();
            expect(component.isVasException).toBeTruthy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("closeView()", () => {
        it("should close the matDialogRef", () => {
            const spy = jest.spyOn(mockDialogRef, "close");
            component.closeView();
            expect(spy).toBeCalled();
        });
    });

    describe("fetchLanguageData()", () => {
        it("should fetch language strings from db", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.fetchLanguageData();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsub$"], "next");
            const spyForComplete = jest.spyOn(component["unsub$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
