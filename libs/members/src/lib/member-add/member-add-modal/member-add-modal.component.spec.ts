import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";
import { mockMatDialogRef, mockMemberService } from "@empowered/testing";
import { MemberAddModalComponent } from "./member-add-modal.component";
import { MemberService } from "@empowered/api";
import { of } from "rxjs";

const data = {
    title: "default",
    content: null,
};
@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

describe("MemberAddModalComponent", () => {
    let component: MemberAddModalComponent;
    let fixture: ComponentFixture<MemberAddModalComponent>;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MemberAddModalComponent, MockMonIconComponent],
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
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                LanguageService,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatDialogModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MemberAddModalComponent);
        component = fixture.componentInstance;
        TestBed.inject(MatDialogRef);
        memberService = TestBed.inject(MemberService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("primaryButtonClick()", () => {
        beforeEach(() => {
            component.data.primaryButton = {
                buttonTitle: "save",
            };
            component.data.memberId = 111;
            component.data.mpGroupId = 11;
        });
        it("should successfully delete member", () => {
            const spy1 = jest.spyOn(memberService, "deleteMember").mockReturnValue(of({}));
            component.primaryButtonClick();
            expect(spy1).toBeCalledWith(11, 111);
        });

        it("should close the dialog after save", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.primaryButtonClick();
            expect(spy1).toBeCalledWith("Save");
        });
    });

    describe("closePopup()", () => {
        it("should close the dialog on click of close", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closePopup();
            expect(spy1).toBeCalled();
        });
    });

    describe("secondaryButtonClick()", () => {
        it("should close the dialog if cancel is clicked", () => {
            component.data.secondaryButton = {
                buttonTitle: "save",
            };
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.secondaryButtonClick();
            expect(spy1).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
