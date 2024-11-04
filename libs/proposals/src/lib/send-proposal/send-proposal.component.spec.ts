import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountService, AdminService, ProposalService, StaticService } from "@empowered/api";
import { MPGroupAccountService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import {
    mockAccountService,
    mockAdminService,
    mockLanguageService,
    mockMatDialogRef,
    mockMpGroupAccountService,
    mockProposalService,
    mockStaticService,
    mockStaticUtilService,
} from "@empowered/testing";
import { MaterialModule } from "@empowered/ui";
import { of, Subscription } from "rxjs";
import { SendProposalComponent } from "./send-proposal.component";
import { StaticUtilService } from "@empowered/ngxs-store";
import { HttpClientTestingModule } from "@angular/common/http/testing";

const mockMatDialogData = {
    id: 1,
    name: "Some Proposal Name",
};

describe("SendProposalComponent", () => {
    let component: SendProposalComponent;
    let fixture: ComponentFixture<SendProposalComponent>;
    let staticUtilService: StaticUtilService;
    let adminService: AdminService;
    let proposalService: ProposalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SendProposalComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: AdminService,
                    useValue: mockAdminService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: proposalService,
                    useValue: mockProposalService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [ReactiveFormsModule, MaterialModule, HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SendProposalComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        adminService = TestBed.inject(AdminService);
        proposalService = TestBed.inject(ProposalService);
        component.mpGroup = 1234;
        component.selection.select({
            id: 12,
            name: {
                firstName: "Some",
                lastName: "Name",
            },
            emailAddress: "abcd@email.com",
            role: "Some Role",
        });
        component.datasource.data = [
            {
                id: 12,
                name: {
                    firstName: "Some",
                    lastName: "Name",
                },
                emailAddress: "abcd@email.com",
                role: "Some Role",
            },
        ];
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("isAllSelected()", () => {
        it("should check if all are selected", () => {
            expect(component.isAllSelected()).toBe(true);
        });
    });

    describe("ngOninit()", () => {
        it("should set config", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("checkboxLabel()", () => {
        it("should determine aria label as select all", () => {
            expect(component.checkboxLabel(null)).toStrictEqual("select all");
        });

        it("should determine aria label as select row", () => {
            expect(
                component.checkboxLabel({
                    id: 12,
                    name: {
                        firstName: "Some",
                        lastName: "Name",
                    },
                    emailAddress: "abcd@email.com",
                    role: "Some Role",
                }),
            ).toStrictEqual("select row $ {row.position + 1}");
        });
    });

    describe("checkFlyerForStates()", () => {
        it("should call getMissingEmployerFlyer", () => {
            const spy = jest.spyOn(proposalService, "getMissingEmployerFlyer");
            component.checkFlyerForStates("WA");
            expect(spy).toBeCalledWith(1, "1234", "WA");
        });
    });

    describe("chooseOption()", () => {
        it("should check isRatesSelected o be true", () => {
            component.chooseOption("RATES_ONLY");
            expect(component.isRatesSelected).toBe(true);
        });

        it("should check isRatesSelected to be false", () => {
            component.chooseOption("FULL");
            expect(component.isRatesSelected).toBe(false);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toBeCalled();
        });
    });
});
