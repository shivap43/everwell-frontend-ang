import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { MemberService, ShoppingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { ShopCartService, UtilService } from "@empowered/ngxs-store";
import {
    mockActivatedRoute,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockRouter,
    mockShoppingService,
    mockStore,
    mockUtilService,
} from "@empowered/testing";
import { Store } from "@ngxs/store";
import { EditPlanOrderComponent } from "./edit-plan-order.component";

const mockDialogData = {
    type: "email",
};
describe("EditPlanOrderComponent", () => {
    let component: EditPlanOrderComponent;
    let fixture: ComponentFixture<EditPlanOrderComponent>;
    const formBuilder = new FormBuilder();
    let matDialog: MatDialogRef<EditPlanOrderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditPlanOrderComponent],
            providers: [
                FormBuilder,
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: ShopCartService,
                    useValue: mockShoppingService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditPlanOrderComponent);
        component = fixture.componentInstance;
        component.emailForm = formBuilder.group({
            emailName: [""],
            note: [""],
        });
        matDialog = TestBed.inject(MatDialogRef);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("initializeEmailForm()", () => {
        it("should initialize the email form group to include emailName and note", () => {
            component.initializeEmailForm();
            expect(component.emailForm.controls.emailName.value).toStrictEqual("");
            expect(component.emailForm.controls.note.value).toStrictEqual("");
        });
    });

    describe("updateEmail()", () => {
        it("should update email", () => {
            component.emailForm.controls.emailName.setValue("abc@test.com");
            component.updateEmail();
            expect(component.email).toStrictEqual("abc@test.com");
        });
    });

    describe("sendNote()", () => {
        it("should send note", () => {
            component.emailForm.controls.note.setValue("test");
            component.sendNote();
            expect(component.notes).toStrictEqual("test");
        });
    });

    describe("closeDialog()", () => {
        it("should call close dialog when closeDialog gets called", () => {
            const spy = jest.spyOn(matDialog, "close");
            component.closeDialog();
            expect(spy).toBeCalled();
        });
    });
});
