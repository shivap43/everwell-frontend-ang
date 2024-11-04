import { of } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { provideMockStore } from "@ngrx/store/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanDetailsLinkComponent } from "./plan-details-link.component";
import { CountryState, Plan, PlanOffering } from "@empowered/constants";
import { PlanOfferingService } from "../../services/plan-offering/plan-offering.service";
import { mockLanguageService, mockMatDialog } from "@empowered/testing";

const mockPlanOfferingService = {
    getPlan: (planOffering: PlanOffering) => planOffering.plan,
} as PlanOfferingService;

const mockPlanOffering = [
    { id: 4565, plan: { id: 4565 }, brokerSelected: false },
    { id: 1234, plan: { id: 1234 }, brokerSelected: true },
    { id: 1134, plan: { id: 6754 }, brokerSelected: true },
] as PlanOffering[];
describe("PlanDetailsLinkComponent", () => {
    let component: PlanDetailsLinkComponent;
    let fixture: ComponentFixture<PlanDetailsLinkComponent>;
    let planOfferingService: PlanOfferingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanDetailsLinkComponent],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: PlanOfferingService,
                    useValue: mockPlanOfferingService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanDetailsLinkComponent);
        planOfferingService = TestBed.inject(PlanOfferingService);
        component = fixture.componentInstance;
        component["planOffering"] = {
            plan: {
                policySeries: "Q6006",
            },
        } as PlanOffering;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("displayPlanDocuments()", () => {
        it("should display plan documents pop up based on mpGroup, selected CountryState", () => {
            const plan = {
                id: 1,
                name: "Accident",
                policySeries: "A57653",
                product: {
                    id: 3,
                },
            } as Plan;
            const spy = jest.spyOn(planOfferingService, "getPlan").mockReturnValueOnce(plan);
            component.planOffering = { id: 2, plan: plan } as PlanOffering;
            component.displayPlanDocuments(312345, { name: "GA", abbreviation: "GA" } as CountryState, [12], "CA", "12-12-2023");
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("getFilterRiderPlanIdObservables()", () => {
        it("should filter observable of filtered rider ids", () => {
            const rxjs = jest.requireActual("rxjs");
            jest.spyOn(rxjs, "combineLatest").mockReturnValue(of([mockPlanOffering, [1234, 4565]]));
            component.getFilterRiderPlanIdObservables();
        });
    });

    describe("getFilterRiderPlanId()", () => {
        it("should filter rider id from broker selected riders", () => {
            component.getFilterRiderPlanId(mockPlanOffering, [1234, 4565]);
        });
    });
});
