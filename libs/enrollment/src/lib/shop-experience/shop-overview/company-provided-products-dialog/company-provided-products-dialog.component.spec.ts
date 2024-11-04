import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CompanyProvidedProductsDialogComponent } from "./company-provided-products-dialog.component";
import { MockReplaceTagPipe } from "@empowered/testing";

const data = {
    products: ["Accident", "Cancer"],
    firstName: "name",
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("CompanyProvidedProductsDialogComponent", () => {
    let component: CompanyProvidedProductsDialogComponent;
    let fixture: ComponentFixture<CompanyProvidedProductsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CompanyProvidedProductsDialogComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                LanguageService,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CompanyProvidedProductsDialogComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("save()", () => {
        it("should close the dialog on saving", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.save();
            expect(spy1).toBeCalledWith("save");
        });
    });
});
