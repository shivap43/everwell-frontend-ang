import { MatStepper } from "@angular/material/stepper";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ViewFormComponent } from "./view-form.component";
import { NgxsModule, Store } from "@ngxs/store";
import { QuestionControlService } from "../question-control.service";
import { FormBuilder } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { of } from "rxjs";
import { DatePipe } from "@angular/common";
import { mockDatePipe, mockQuestionControlService } from "@empowered/testing";

const mockMatDialogRef = { close: () => {} };

const matDialogData = {
    suggestedAddress: {},
    providedAddress: {},
    addressResp: true,
    addressMessage: "",
    option: "bothOption",
    errorStatus: 503,
};

const mockStore = {
    selectSnapshot: () => of(""),
    dispatch: () => of({}),
    select: () => of({}),
} as unknown as Store;

describe("ClasstypePopupComponent", () => {
    let component: ViewFormComponent;
    let fixture: ComponentFixture<ViewFormComponent>;
    let questionControlService: QuestionControlService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ViewFormComponent],
            providers: [
                FormBuilder,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
                },
                {
                    provide: QuestionControlService,
                    useValue: mockQuestionControlService,
                },
                { provide: Store, useValue: mockStore },
                { provide: DatePipe, useValue: mockDatePipe },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewFormComponent);
        component = fixture.componentInstance;
        questionControlService = TestBed.inject(QuestionControlService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("saveButtonEventHandler()", () => {
        it("should enable save and close button according to event", () => {
            component.saveButtonEventHandler(true);
            expect(component.isSaveDisabled).toEqual(true);
        });
    });

    describe("showPageTitle()", () => {
        const pageNumber = 10;
        it("should show page title if form is not reliance custom form", () => {
            component.formIsRelianceCustomForm = false;
            expect(component.showPageTitle(pageNumber)).toEqual(true);
        });

        it("should not show page title if selectedIndex is 0 and pageNumber is greater than RELIANCE_CUSTOM_FORM_STEP_2_PAGE1_INDEX", () => {
            component.formIsRelianceCustomForm = true;
            component.matStepper = { selectedIndex: 0 } as MatStepper;
            expect(component.showPageTitle(pageNumber)).toEqual(false);
        });

        it("should show page title if selectedIndex is 1 and pageNumber is greater than RELIANCE_CUSTOM_FORM_STEP_2_PAGE1_INDEX", () => {
            component.formIsRelianceCustomForm = true;
            component.matStepper = { selectedIndex: 1 } as MatStepper;
            expect(component.showPageTitle(pageNumber)).toEqual(true);
        });
    });
});
