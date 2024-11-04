import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { Plan, TaxStatus } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { mockEmpoweredModalService, mockLanguageService } from "@empowered/testing";
import { of, Subscription } from "rxjs";
import { AflacPassProductComponent } from "./aflac-pass-product.component";
import { LeaveConfirmationDialogComponent } from "./leave-confirmation-dialog/leave-confirmation-dialog.component";

describe("AflacPassProductComponent", () => {
    let component: AflacPassProductComponent;
    let fixture: ComponentFixture<AflacPassProductComponent>;
    let empoweredModalService: EmpoweredModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AflacPassProductComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AflacPassProductComponent);
        component = fixture.componentInstance;
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        component.productOffering = {
            id: 12,
            product: {
                id: 55,
                name: "Accident",
                missingEmployerFlyer: false,
            },
        };
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnChanges()", () => {
        it("should set the product name received from the Input decorator", () => {
            component.ngOnChanges();
            expect(component.productName).toStrictEqual("Accident");
        });
    });

    describe("openConfirmationModal()", () => {
        it("should open leave confirmation modal", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openConfirmationModal({
                id: 12,
                plan: {} as Plan,
                taxStatus: {} as TaxStatus,
                agentAssistanceRequired: true,
                linkText: "some link",
            });
            expect(spy).toBeCalledWith(LeaveConfirmationDialogComponent, { data: { buttonTitle: "some link" } });
        });
    });

    describe("setPlanExpanded()", () => {
        it("should set card expansion property", () => {
            component.setPlanExpanded(true);
            expect(component.isPlanExpanded).toBe(true);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe all subscriptions during component destruction", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
