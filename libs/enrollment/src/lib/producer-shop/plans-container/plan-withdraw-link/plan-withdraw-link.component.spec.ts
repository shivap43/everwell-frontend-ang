import { ComponentType } from "@angular/cdk/portal";
import { TemplateRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { of } from "rxjs";
import { PlanWithdrawLinkComponent } from "./plan-withdraw-link.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { mockProducerShopHelperService } from "@empowered/testing";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";

const mockMatDialog = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as EmpoweredModalService;

describe("PlanWithdrawLinkComponent", () => {
    let component: PlanWithdrawLinkComponent;
    let fixture: ComponentFixture<PlanWithdrawLinkComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: ProducerShopHelperService,
                    useValue: mockProducerShopHelperService,
                },
            ],
            declarations: [PlanWithdrawLinkComponent],
            imports: [HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanWithdrawLinkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("withDrawPlan()", () => {
        it("should emit when click on plan withdraw link", () => {
            const spy = jest.spyOn(component["withDrawPlanLinkClicked$"], "next");
            component.withDrawPlan();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
