import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockMatDialogRef } from "@empowered/testing";

import { DeactivateAccountPopupComponent } from "./deactivate-account-popup.component";

const mockMatDialogData = {
    mpGroup: 12345,
    title: "Deactivate #name?",
    accountName: "CLAXTON HOBBS PHARMACY - KDZ1",
    checkedOutAccount: true,
    deactivateMsg: "deactivating this account",
};

describe("DeactivateAccountPopupComponent", () => {
    let component: DeactivateAccountPopupComponent;
    let fixture: ComponentFixture<DeactivateAccountPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeactivateAccountPopupComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DeactivateAccountPopupComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize the component", () => {
            component.ngOnInit();
            expect(component.deactivateTitle).toStrictEqual("Deactivate CLAXTON HOBBS PHARMACY - KDZ1?");
            expect(component.deactivateMsg).toStrictEqual("deactivating this account");
            expect(component.isAccountCheckedOut).toStrictEqual(true);
        });
    });

    describe("onCancelClick()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy1).toBeCalled();
        });
    });

    describe("onDeActivateAccount()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onDeActivateAccount();
            expect(spy1).toBeCalledWith(12345);
        });
    });
});
