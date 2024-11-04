import { FormPageQuestionComponent } from "./form-page-question.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxMaskPipe } from "ngx-mask";
import { of } from "rxjs";
import { NgxsModule, Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { QuestionControlService } from "../question-control.service";
import { CurrencyPipe } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { CarrierFormQuestion, CarrierFormQuestionType } from "@empowered/api";
import { StaticUtilService } from "@empowered/ngxs-store";
import { mockStaticUtilService } from "@empowered/testing";
const mockStore = {
    dispatch: () => {},
    selectSnapshot: () => of(""),
};
const mockMaskPipe = {};
const mockLanguageService = {
    fetchPrimaryLanguageValue: (key: string) => key,
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;
const mockQuestionControlService = {
    questionHasDependencies: () => {},
};
@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
const mockCurrencyPipe = new MockCurrencyPipe();
describe("FormPageQuestionComponent", () => {
    let component: FormPageQuestionComponent;
    let fixture: ComponentFixture<FormPageQuestionComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FormPageQuestionComponent],
            providers: [
                {
                    provide: NgxMaskPipe,
                    useValue: mockMaskPipe,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: QuestionControlService,
                    useValue: mockQuestionControlService,
                },
                {
                    provide: CurrencyPipe,
                    useValue: mockCurrencyPipe,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(FormPageQuestionComponent);
        component = fixture.componentInstance;
        component.question = { type: "TEXT" as CarrierFormQuestionType } as CarrierFormQuestion;
        fixture.detectChanges();
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("clearFlags()", () => {
        it("should set to false if 'disableADPCCR' is true", () => {
            component.disableADPCCR = true;
            expect(component.disableADPCCR).toBe(true);
            fixture.detectChanges();
            component.clearFlags();
            expect(component.disableADPCCR).toBe(false);
        });
        it("should set to false if 'disableECCPR' is true", () => {
            component.disableECCPR = true;
            expect(component.disableECCPR).toBe(true);
            fixture.detectChanges();
            component.clearFlags();
            expect(component.disableECCPR).toBe(false);
        });
        it("should set to false if 'disableRPDPR' is true", () => {
            component.disableRPDPR = true;
            expect(component.disableRPDPR).toBe(true);
            fixture.detectChanges();
            component.clearFlags();
            expect(component.disableRPDPR).toBe(false);
        });
        it("should set to false if 'disableADPCCRTL' is true", () => {
            component.disableADPCCRTL = true;
            expect(component.disableADPCCRTL).toBe(true);
            fixture.detectChanges();
            component.clearFlags();
            expect(component.disableADPCCRTL).toBe(false);
        });
    });
    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsub$"], "next");
            fixture.destroy();
            expect(next).toBeCalledTimes(1);
        });
    });
});
