import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MemberContactListDisplay, SendPdaDialogAction, SendPdaDialogData } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

import { SendApplicantPdaComponent } from "./send-applicant-pda.component";
import { MockReplaceTagPipe } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";

const mockMatDialogRef = { close: () => {} };

@Component({
    selector: "empowered-mat-radio-group",
    template: "",
})
class MockMatRadioGroupComponent {}
@Component({
    selector: "empowered-mat-dialog-content",
    template: "",
})
class MockDialogContentComponent {}

@Component({
    selector: "empowered-mat-dialog-actions",
    template: "",
})
class MockDialogActionsComponent {}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

const data = {
    contactList: [] as MemberContactListDisplay[],
    firstName: "employee",
} as SendPdaDialogData;

describe("SendApplicantPdaComponent", () => {
    let component: SendApplicantPdaComponent;
    let fixture: ComponentFixture<SendApplicantPdaComponent>;
    let matDialogRef: MatDialogRef<SendApplicantPdaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                SendApplicantPdaComponent,
                MockDialogContentComponent,
                MockDialogActionsComponent,
                MockMatRadioGroupComponent,
                MockReplaceTagPipe,
            ],
            providers: [
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SendApplicantPdaComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        component.contactForm = new FormGroup({
            contacts: new FormControl("phone"),
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeDialog()", () => {
        it("should close dialog when user clicks on sent to applicant button", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.closeDialog(SendPdaDialogAction.SEND);
            expect(spy).toBeCalledWith({ action: SendPdaDialogAction.SEND, selectedValue: "phone" });
        });
    });
});
