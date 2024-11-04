import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { CancelRequestPopUpComponent } from "./cancel-request-pop-up.component";
import { mockLanguageService, mockMatDialogData, mockMatDialogRef } from "@empowered/testing";

describe("CancelRequestPopUpComponent", () => {
    let component: CancelRequestPopUpComponent;
    let fixture: ComponentFixture<CancelRequestPopUpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CancelRequestPopUpComponent],
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
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CancelRequestPopUpComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onSubmit()", () => {
        it("should close the dialog on submit", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onSubmit();
            expect(spy1).toBeCalledWith(true);
        });
    });
});
