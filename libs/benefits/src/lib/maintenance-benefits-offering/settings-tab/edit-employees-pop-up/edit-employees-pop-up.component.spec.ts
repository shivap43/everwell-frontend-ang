import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EditEmployeesPopUpComponent } from "./edit-employees-pop-up.component";
import { of } from "rxjs";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

const data = {
    recentcensusData: {
        count: 20,
    },
};

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchPrimaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockStore = {
    dispatch: () => {},
    selectSnapshot: () => of(""),
};

describe("EditEmployeesPopUpComponent", () => {
    let component: EditEmployeesPopUpComponent;
    let fixture: ComponentFixture<EditEmployeesPopUpComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditEmployeesPopUpComponent],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                FormBuilder,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                { provide: LanguageService, useValue: mockLanguageService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditEmployeesPopUpComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        component.form = new FormGroup({
            employeeEstimate: new FormControl(10, [Validators.required]),
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("radioChange()", () => {
        it("should set radio button value on change", () => {
            const event = {
                value: "selected",
            };
            component.radioChange(event);
            expect(component.radioValue).toBe("selected");
        });
    });

    describe("submitForm()", () => {
        it("should set radio button default value and update census estimate as per the form value", () => {
            component.radioValue = "";
            const spy1 = jest.spyOn(component, "updateCensusEstimate");
            component.submitForm();
            expect(component.radioValue).toBe("1");
            expect(spy1).toBeCalledWith(10);
        });
        it("should update census estimate as per the data received when radio button value is 2", () => {
            component.radioValue = "2";
            const spy1 = jest.spyOn(component, "updateCensusEstimate");
            component.submitForm();
            expect(spy1).toBeCalledWith(20);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
