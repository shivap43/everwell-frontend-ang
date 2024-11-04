import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockMatDialog, mockStore } from "@empowered/testing";
import { Store } from "@ngxs/store";
import { ChangeProducerRoleComponent } from "./change-producer-role.component";

const data = {
    title: "",
    content: "",
    primaryButton: {
        buttonTitle: "save",
        buttonAction: null,
    },
    secondaryButton: {
        buttonTitle: "do not save",
        buttonAction: null,
    },
    profileChangesData: [],
};

describe("ChangeProducerRoleComponent", () => {
    let component: ChangeProducerRoleComponent;
    let fixture: ComponentFixture<ChangeProducerRoleComponent>;
    let languageService: LanguageService;
    let matdialogRef: MatDialogRef<ChangeProducerRoleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangeProducerRoleComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChangeProducerRoleComponent);
        component = fixture.componentInstance;
        languageService = TestBed.inject(LanguageService);
        matdialogRef = TestBed.inject(MatDialogRef);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call the fetchlanguageValues method", () => {
            const mockResponse = {
                "primary.portal.commission.producer.change.header": "Change ##PRODUCERFIRSTNAME##'s role",
                "primary.portal.commission.producer.replace.hint": "Replaces ##PRIMARY## as primary producer",
            } as Record<string, string>;
            jest.spyOn(languageService, "fetchPrimaryLanguageValues").mockReturnValue(mockResponse);
            const spy = jest.spyOn(component, "fetchlanguageValues");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("closePopup()", () => {
        it("should close the dialog", () => {
            const dialogSpy = jest.spyOn(matdialogRef, "close");
            component.closePopup();
            expect(dialogSpy).toBeCalled();
        });
    });

    describe("primaryButtonClick()", () => {
        it("should close dialog on click of primary button", () => {
            component.selectedRole = "Role 1";
            const mockArg = { save: "Save", selectedRole: component.selectedRole };
            const dialogSpy = jest.spyOn(matdialogRef, "close");
            component.primaryButtonClick();
            expect(dialogSpy).toBeCalledWith(mockArg);
        });
    });

    describe("", () => {
        it("should close dialog on click of secondary button", () => {
            const dialogSpy = jest.spyOn(matdialogRef, "close");
            component.secondaryButtonClick();
            expect(dialogSpy).toBeCalledWith("Don't Save");
        });
    });
});
