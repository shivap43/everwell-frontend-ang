import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProfileChangesConfirmPromptComponent } from "./profile-changes-confirm-prompt.component";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { mockMatDialog, mockMatDialogData } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { SharedState } from "@empowered/ngxs-store";
import { Configuration } from "@empowered/api";

describe("ProfileChangesConfirmPromptComponent", () => {
    let component: ProfileChangesConfirmPromptComponent;
    let fixture: ComponentFixture<ProfileChangesConfirmPromptComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProfileChangesConfirmPromptComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                Configuration,
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    // beforeEach(() => {

    // });
    beforeEach(() => {
        fixture = TestBed.createComponent(ProfileChangesConfirmPromptComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { someRegex: "SAMPLE_REGEX" },
                portal: "Producer",
            },
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onSubmit()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onSubmit();
            expect(spy1).toBeCalledWith(true);
        });
    });
});
