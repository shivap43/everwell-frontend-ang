import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDividerModule } from "@angular/material/divider";
import { MemberService, ShoppingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { EbsPaymentRecord, GetCartItems, StaticStep, TaxStatus } from "@empowered/constants";
import {
    mockAppFlowService,
    mockDatePipe,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockMemberService,
    mockRouter,
    mockShoppingService,
    mockStore,
} from "@empowered/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Observable, of, throwError } from "rxjs";
import { EBSPaymentComponent } from "./ebs-payment.component";
import { EmpoweredModalService } from "@empowered/common-services";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";

describe("EBSPaymentComponent", () => {
    let component: EBSPaymentComponent;
    let shoppingService: ShoppingService;
    let memberService: MemberService;
    let empoweredmodalService: EmpoweredModalService;
    let fixture: ComponentFixture<EBSPaymentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EBSPaymentComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatDividerModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(EBSPaymentComponent);
        component = fixture.componentInstance;
        shoppingService = TestBed.inject(ShoppingService);
        memberService = TestBed.inject(MemberService);
        empoweredmodalService = TestBed.inject(EmpoweredModalService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("check getEbsPaymentOnFile", () => {
        const spy1 = jest.spyOn(memberService, "getEbsPaymentOnFile");
        component.mpGroup = 12345;
        component.memberId = 12;
        component.gotoAflacEBS();
        expect(spy1).toBeCalled();
    });

    it("check member service getEbsPaymentOnFile failure condition", (done) => {
        jest.spyOn(memberService, "getEbsPaymentOnFile").mockReturnValue(throwError(new Error("Request failed")));
        fixture.detectChanges();
        memberService.getEbsPaymentOnFile(1, 2).subscribe(
            () => {},
            (error) => {
                expect(error.message).toBe("Request failed");
                done();
            },
        );
    });

    it("checking onNext called & planChanged Observable - when payment present", (done) => {
        component.paymentPresent = true;
        const spy = jest.spyOn(mockAppFlowService.planChanged$, "next");
        mockAppFlowService.planChanged$.next({ nextClicked: true, discard: false });
        mockAppFlowService.planChanged$.subscribe((value) => {
            expect(spy).toBeCalledWith({ nextClicked: true, discard: false });
            expect(value).toEqual({ nextClicked: true, discard: false });
        });
        component.onNext();
        done();
    });

    it("checking onNext called & lastCompleteStaticStep Observable - when payment present", (done) => {
        component.paymentPresent = true;
        const spy = jest.spyOn(mockAppFlowService.lastCompleteStaticStep, "next");
        mockAppFlowService.lastCompleteStaticStep.next(2);
        mockAppFlowService.lastCompleteStaticStep.subscribe((value) => {
            expect(spy).toBeCalledWith(1);
            expect(value).toEqual(1);
        });
        component.onNext();
        done();
    });

    describe("checkCompleteStatus()", () => {
        it("check the showNextProductFooter for signature button", () => {
            const spy = jest.spyOn(mockAppFlowService.showNextProductFooter$, "next");
            mockAppFlowService.showNextProductFooter$.next({ nextClick: true, data: StaticStep.ONE_SIGNATURE });
            component.checkCompleteStatus();
            expect(spy).toBeCalledWith({ nextClick: true, data: StaticStep.ONE_SIGNATURE });
        });
    });

    it("checking onNext called - when payment is not present", () => {
        component.paymentPresent = false;
        expect(component.paymentRequired).toBe(false);
        component.onNext();
        expect(component.paymentRequired).toBe(true);
    });

    it("check opening of modal", () => {
        const spy1 = jest.spyOn(empoweredmodalService, "openDialog");
        component.gotoAflacEBS();
        expect(spy1).toBeCalled();
    });

    it("check updateCartItem", () => {
        const cartItem: any = {
            id: 1,
            planOffering: {
                id: 101,
                plan: null,
                taxStatus: TaxStatus.PRETAX,
                agentAssistanceRequired: false,
            },
        };
        const spy1 = jest.spyOn(shoppingService, "updateCartItem");
        const data = {} as EbsPaymentRecord;
        component.cartData = [cartItem] as GetCartItems[];
        component.updateCart(data);
        expect(spy1).toBeCalled();
    });

    it("getEbsPaymentOnFile displays correct success message after entering payment info", () => {
        fixture.detectChanges();
        expect(component.ebsPaymentFailed).toBeFalsy();
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });
});
