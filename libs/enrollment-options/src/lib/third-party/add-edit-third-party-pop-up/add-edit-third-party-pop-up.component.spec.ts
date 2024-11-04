import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { AddEditThirdPartyPopUpComponent } from "./add-edit-third-party-pop-up.component";
import { mockLanguageService } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

const data = "default";

const mockMatDialog = {
    close: ({ dialogResult = true }) => null,
} as MatDialogRef<any>;

describe("AddEditThirdPartyPopUpComponent", () => {
    let component: AddEditThirdPartyPopUpComponent;
    let fixture: ComponentFixture<AddEditThirdPartyPopUpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddEditThirdPartyPopUpComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddEditThirdPartyPopUpComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("primaryButtonClick()", () => {
        it("should close the dialog if existing PDF is to be edited", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.primaryButtonClick();
            expect(spy1).toBeCalledWith("primary.portal.thirdParty.overlapEditExisting");
        });
    });

    describe("secondaryButtonClick()", () => {
        it("should close the dialog on cancel", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.secondaryButtonClick();
            expect(spy1).toBeCalledWith("primary.portal.common.cancel");
        });
    });
});
