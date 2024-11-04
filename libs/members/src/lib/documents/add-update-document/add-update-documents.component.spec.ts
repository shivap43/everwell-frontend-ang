import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { of } from "rxjs";
import { AddUpdateDocumentComponent } from "./add-update-document.component";

const mockStore = {
    selectSnapshot: () => of(""),
} as unknown as Store;

const mockMatDialogRef = { close: () => {} };

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

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
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("AddUpdateDocumentComponent", () => {
    let fixture: ComponentFixture<AddUpdateDocumentComponent>;
    let app: AddUpdateDocumentComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, ReactiveFormsModule, MatDialogModule],
            declarations: [
                AddUpdateDocumentComponent,
                MockMonIconComponent,
                MockMatLabelComponent,
                MockMatHintComponent,
                MockMatFormFieldComponent,
                MockMonAlertComponent,
                MockMonSpinnerComponent,
                MockRichTooltipDirective,
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
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(AddUpdateDocumentComponent);
        app = fixture.componentInstance;
    }, 60 * 1000); // Set jest timeout to 1 minute since ci tends to take longer than the default 5 seconds

    it("should create the app", () => {
        expect(app).toBeTruthy();
    });

    it("should get uploaded document", () => {
        app.mpGroupId = 1;
        app.uploadedDocument = [];
        app.getUploadedDocument(1);
        expect(app.uploadedDocument).toBeTruthy();
    });

    it("should leave without saving action", () => {
        const spy = jest.spyOn(app, "onLeaveWithoutSavingAction");
        app.onLeaveWithoutSavingAction(false);
        expect(spy).toBeCalled();
    });

    it("should patch values", () => {
        app.uploadedDocument = [""];
        const data = {
            documents: [
                {
                    id: 1,
                    fileName: "",
                },
            ],
        };
        app.langStrings["primary.portal.members.document.addUpdate.lastUpdatedDate"] = "";
        app.langStrings["primary.portal.members.document.addUpdate.uploadedOn"] = "";
        app.patchValues(data);
        expect(app.uploadedDocument).toStrictEqual(["", 1]);
    });

    it("should get member note", () => {
        app.mpGroupId = 1;
        const spy = jest.spyOn(app, "getMemberNote");
        app.getMemberNote();
        expect(spy).toBeCalled();
    });
});
