import { mockDatePipe, mockLanguageService, mockMatDialog, mockMatDialogRef } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { DatePipe } from "@angular/common";
import { ApproveDenialQleComponent } from "./approve-denial-qle.component";
import { MemberInfoState } from "@empowered/ngxs-store";
import { Subscription } from "rxjs";

const mockSubscription = [
    {
        unsubscribe: () => {},
    },
] as Subscription[];

describe.skip("ApproveDenialQleComponent", () => {
    let component: ApproveDenialQleComponent;
    let fixture: ComponentFixture<ApproveDenialQleComponent>;
    let store: Store;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([MemberInfoState]), HttpClientTestingModule],
            declarations: [ApproveDenialQleComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        selectedVal: {
                            status: "APPROVED",
                            isStatusViewPendingEnrollments: true,
                            documents: [],
                        },
                    },
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                { provide: DatePipe, useValue: mockDatePipe },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            MemberAdd: {
                memberInfo: {
                    name: {
                        firstName: "ANDERSON",
                    },
                },
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApproveDenialQleComponent);
        component = fixture.componentInstance;
        component.isPending = false;
    });

    describe("ApproveDenialQleComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("ngOnInit()", () => {
        it("should initialize the component with populated store data", () => {
            component.ngOnInit();
            expect(component.name).toStrictEqual("ANDERSON's");
            expect(component.isPending).toBeTruthy();
        });
    });

    describe("closeForm()", () => {
        it("should close the dialog on click of closeForm button", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeForm();
            expect(spy).toBeCalled();
        });
    });

    describe("openPendingEnrollmentDialog()", () => {
        it("should open dialog for pending enrollment component", () => {
            const spy = jest.spyOn(mockMatDialog, "open");
            component.openPendingEnrollmentDialog();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            component.apiSubscription = mockSubscription;
            const spy = jest.spyOn(mockSubscription[0], "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toBeCalled();
        });
    });
});
