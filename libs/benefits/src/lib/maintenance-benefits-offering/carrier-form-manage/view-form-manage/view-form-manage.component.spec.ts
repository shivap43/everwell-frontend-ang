import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { mockBenefitsOfferingService, mockDomSanitizer, mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { ViewFormManageComponent } from "./view-form-manage.component";
import { BenefitsOfferingService, CarrierFormWithCarrierInfo } from "@empowered/api";
import { DomSanitizer } from "@angular/platform-browser";

const data = {
    form: {
        statusId: 3,
        carrierId: 1,
        carrierName: "name",
        formName: "form",
        formStatus: "status",
    } as CarrierFormWithCarrierInfo,
    mpGroup: 1,
};

describe("ViewFormManageComponent", () => {
    let component: ViewFormManageComponent;
    let fixture: ComponentFixture<ViewFormManageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ViewFormManageComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewFormManageComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("close()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.close();
            expect(spy1).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
