import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { mockMatDialog, mockPCRSideNavService } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { SideNavService } from "./policy-change-request-flow/side-nav/services/side-nav.service";
import { PolicyChangeRequestComponent } from "./policy-change-request.component";
describe("PolicyChangeRequestComponent", () => {
    let component: PolicyChangeRequestComponent;
    let fixture: ComponentFixture<PolicyChangeRequestComponent>;
    let pcrSidenavService: SideNavService;
    let mockDialog: MatDialog;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PolicyChangeRequestComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: SideNavService,
                    useValue: mockPCRSideNavService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PolicyChangeRequestComponent);
        pcrSidenavService = TestBed.inject(SideNavService);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialog);
    });

    describe("PolicyChangeRequestComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("closeModal", () => {
        it("should close the modal", () => {
            const spy = jest.spyOn(pcrSidenavService, "removeTransactionScreenFromStore");
            const spy1 = jest.spyOn(mockDialog, "closeAll");
            component.closeModal();
            expect(spy).toBeCalledWith(true);
            expect(spy1).toBeCalled();
        });
    });
    describe("isPolicyFlowIndex", () => {
        jest.spyOn(mockPCRSideNavService, "getPolicyHolderName").mockReturnValue("SampleName");
        it("should get policyHolderName and should return true if policyFlowIndex equals to the passed id", () => {
            component.policyFlowIndex = 0;
            component.isPolicyFlowIndex(0);
            expect(component.policyHolderName).toEqual("SampleName");
            expect(component.isPolicyFlowIndex(0)).toBe(true);
        });
        it("should get policyHolderName and should return false if policyFlowIndex is not equal to the passed id", () => {
            component.policyFlowIndex = 0;
            component.isPolicyFlowIndex(2);
            expect(component.policyHolderName).toEqual("SampleName");
            expect(component.isPolicyFlowIndex(2)).toBe(false);
        });
    });
    describe("ngOnDestroy", () => {
        it("should unsubscribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
