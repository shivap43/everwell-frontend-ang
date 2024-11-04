import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ReplacePlanDialogComponent } from "./replace-plan-dialog.component";
import { MockReplaceTagPipe } from "@empowered/testing";

const data = {
    productName: "name",
    empName: "name",
    isDualPlanYear: false,
    planEdit: false,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;
describe("ReplacePlanDialogComponent", () => {
    let component: ReplacePlanDialogComponent;
    let fixture: ComponentFixture<ReplacePlanDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReplacePlanDialogComponent, MockReplaceTagPipe],
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
        fixture = TestBed.createComponent(ReplacePlanDialogComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call onInit on ngOnInit", () => {
            component.ngOnInit();
            expect(component.employeeName).toStrictEqual("name");
        });
    });

    describe("onReplace()", () => {
        it("should close the dialog on replacing the plan", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onReplace();
            expect(spy1).toBeCalledWith({ action: "replace" });
        });
    });
});
