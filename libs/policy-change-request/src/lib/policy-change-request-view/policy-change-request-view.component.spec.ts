import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PolicyChangeRequestService } from "@empowered/api";
import { UtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { mockMatDialog, mockUtilService } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { Subscription, of } from "rxjs";
import { PolicyChangeRequestViewComponent } from "./policy-change-request-view.component";
import { MaterialModule } from "@empowered/ui";

const data = {
    formId: 1,
};

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

describe("PolicyChangeRequestViewComponent", () => {
    let component: PolicyChangeRequestViewComponent;
    let fixture: ComponentFixture<PolicyChangeRequestViewComponent>;
    let matdialogRef: MatDialogRef<PolicyChangeRequestViewComponent>;
    let policyChangeRequestService: PolicyChangeRequestService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PolicyChangeRequestViewComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                DatePipe,
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PolicyChangeRequestViewComponent);
        component = fixture.componentInstance;
        matdialogRef = TestBed.inject(MatDialogRef);
        policyChangeRequestService = TestBed.inject(PolicyChangeRequestService);
        component.documentIdArray = [0, 1, 2];
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getDocumentId()", () => {
        it("should add documentID to documentIDArray", () => {
            component.getDocumentId(9);
            expect(component.documentIdArray).toStrictEqual([0, 1, 2, 9]);
        });
    });

    describe("removeDocument()", () => {
        it("should remove documentID from documentIDArray", () => {
            component.removeDocument(1);
            expect(component.documentIdArray).toStrictEqual([0, 2]);
        });
    });

    describe("closeDialog()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog();
            expect(spy1).toBeCalled();
        });
    });

    describe("closeModal()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog();
            expect(spy1).toBeCalled();
        });
    });

    describe("cancelChanges()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog();
            expect(spy1).toBeCalled();
        });
    });
    describe("saveChanges()", () => {
        it("should close the dialog box", () => {
            const spy = jest.spyOn(matdialogRef, "close");
            component.documentIdArray = [];
            component.saveChanges();
            expect(spy).toBeCalled();
        });

        it("should be called addTransactionDocumentsToForm method with formId and documentIdArray", () => {
            const documentIdArray = (component.documentIdArray = [12, 23, 24, 67]);
            const formId = (component.formId = 12);
            const spy1 = jest.spyOn(matdialogRef, "close");
            const spy2 = jest.spyOn(policyChangeRequestService, "addTransactionDocumentsToForm").mockReturnValue(of({}));
            component.saveChanges();
            expect(spy2).toBeCalledWith(formId, documentIdArray);
            expect(spy1).toBeCalled();
        });
    });
    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
