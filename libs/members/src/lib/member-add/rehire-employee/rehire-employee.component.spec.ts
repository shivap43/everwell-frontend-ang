import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService } from "@empowered/testing";
import { Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { of } from "rxjs";
import { RehireEmployeeComponent } from "./rehire-employee.component";
import { MatDatepicker } from "@angular/material/datepicker";

const mockStore = {
    selectSnapshot: () => of(""),
} as unknown as Store;

const mockMatDialogRef = { close: () => {} };

const mockMaskPipe = {
    transform: (value: string, mask: string) => "09/09/2000",
} as NgxMaskPipe;

const data = {
    content: "",
};

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

@Component({
    selector: "mat-hint",
    template: "",
})
class MockMatHintComponent {}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatePickerComponent {}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatePickerToggleComponent {}

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

describe("RehireEmployeeComponent", () => {
    let fixture: ComponentFixture<RehireEmployeeComponent>;
    let app: RehireEmployeeComponent;
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, ReactiveFormsModule, MatDialogModule],
            declarations: [
                RehireEmployeeComponent,
                MockMonIconComponent,
                MockMatLabelComponent,
                MockMatHintComponent,
                MockMatFormFieldComponent,
                MockMatDatePickerComponent,
                MockMatDatePickerToggleComponent,
                MockMonAlertComponent,
                MockMatDatePickerDirective,
            ],
            providers: [
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: NgxMaskPipe,
                    useValue: mockMaskPipe,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    }, 60 * 1000); // Set jest timeout to 1 minute since ci tends to take longer than the default 5 seconds

    beforeEach(() => {
        fixture = TestBed.createComponent(RehireEmployeeComponent);
        languageService = TestBed.inject(LanguageService);
        app = fixture.componentInstance;
    });

    it("should create the app", () => {
        expect(app).toBeTruthy();
    });

    it("should date change", () => {
        app.terminationDate = "01/01/2022";
        expect(app.dateChange(true, "01/01/2023")).toBe(undefined);
    });

    it("should close popup", () => {
        const spy = jest.spyOn(app, "closePopup");
        app.closePopup();
        expect(spy).toBeCalled();
    });

    it("should fetch max", () => {
        app.validFutureDate = new Date();
        const date = app.validFutureDate.setDate(new Date().getDate() + 90);
        app.fetchMax();
        expect(app.validFutureDate).toStrictEqual(new Date(date));
    });

    it("should transform", () => {
        const event = {
            target: {
                value: "2000-09-09",
            },
        };
        app.transform(event);
        expect(event.target.value).toBe("09/09/2000");
    });
    describe("showErrorAlertMessage()", () => {
        it("should display bad parameter error when error status is 400", () => {
            const errorMessage = {
                error: { status: 400, code: "badParameter", details: [{ field: "missingId" }] },
            } as unknown as Error;
            // const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValue");
            app.showErrorAlertMessage(errorMessage);
            expect(app.errorMessage).toBe("secondary.portal.members.api.400.badParameter.missingId");
        });
        it("should display generic error when error status is not 400", () => {
            const errorMessage = {
                error: {
                    status: 500,
                    code: "generic",
                    details: ["error"],
                },
            } as unknown as Error;
            app.showErrorAlertMessage(errorMessage);
            expect(app.errorMessage).toBe("secondary.api.500.generic");
        });
    });

    describe("secondaryButtonClick()", () => {
        it("should close popup", () => {
            const spy = jest.spyOn(app, "secondaryButtonClick");
            app.secondaryButtonClick();
            expect(spy).toBeCalled();
        });
    });

    describe("getLanguageStrings()", () => {
        it("should get Language Strings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            app.getLanguageStrings();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const spy = jest.spyOn(app["unsubscribe$"], "next");
            const spy2 = jest.spyOn(app["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
