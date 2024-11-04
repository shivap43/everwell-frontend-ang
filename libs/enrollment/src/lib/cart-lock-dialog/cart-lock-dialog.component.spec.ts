import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { MockReplaceTagPipe } from "@empowered/testing";
import { CartLockDialogComponent } from "./cart-lock-dialog.component";

const data = {
    productName: "name",
    empName: "name",
    isDualPlanYear: false,
    planEdit: false,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("CartLockDialogComponent", () => {
    let component: CartLockDialogComponent;
    let fixture: ComponentFixture<CartLockDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CartLockDialogComponent, MockReplaceTagPipe],
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
        fixture = TestBed.createComponent(CartLockDialogComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeModal()", () => {
        it("should close the dialog on replacing the plan", () => {
            const spy1 = jest.spyOn(component["cartDialogRef"], "close");
            component.closeModal();
            expect(spy1).toBeCalled();
        });
    });
});
