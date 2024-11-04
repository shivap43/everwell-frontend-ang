import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AflacService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";
import { mockAflacService, mockLanguageService, mockUtilService } from "@empowered/testing";
import { UniversalService } from "../universal.service";
import { EditPlanDetailsComponent } from "./edit-plan-details.component";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<EditPlanDetailsComponent, any>;

const mockData = {
    type: "edit",
    planSelection: [],
};

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}
@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "empowered-modal",
    template: "",
})
class MockModalComponent {}

@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockModalHeaderComponent {}

@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockModalFooterComponent {}

describe("EditPlanDetailsComponent", () => {
    let component: EditPlanDetailsComponent;
    let fixture: ComponentFixture<EditPlanDetailsComponent>;
    let mockDialog: MatDialogRef<EditPlanDetailsComponent, any>;
    let languageService: LanguageService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                EditPlanDetailsComponent,
                MockMonIconComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockModalFooterComponent,
            ],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: UniversalService,
                    useValue: {},
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditPlanDetailsComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
        component.emailForm = new FormGroup({
            emailName: new FormControl("abcd1234@gmail.com"),
            note: new FormControl(""),
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeDialog()", () => {
        it("should close the EditPlanDetailsComponent", () => {
            const spy = jest.spyOn(mockDialog, "close");
            component.closeDialog();
            expect(spy).toBeCalled();
        });
    });

    describe("updateEmail()", () => {
        it("should update email variable with the value entered in emailForm", () => {
            component.updateEmail();
            expect(component.email).toEqual(component.emailForm.value.emailName);
        });
    });

    describe("sendNote()", () => {
        it("should update notes variable with the value entered in emailForm", () => {
            component.sendNote();
            expect(component.notes).toEqual(component.emailForm.value.note);
        });
    });

    describe("initializeLanguageStrings", () => {
        it("should get the languageStrings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.initializeLanguageStrings();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
