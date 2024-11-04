import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Observable, of, Subscription } from "rxjs";
import { mockLanguageService, mockMatDialog, mockMpGroupAccountService, mockStaticUtilService } from "@empowered/testing";
import { PreviewProposalComponent } from "./preview-proposal.component";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MPGroupAccountService } from "@empowered/common-services";
import { StaticService, ProposalType } from "@empowered/api";
import { CountryState } from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";

const mockMatDialogRef = { close: () => {} };

const data = {
    name: "test",
    state: "GA",
    proposalType: "FULL",
    missingFlyerinfo: [
        {
            planId: 12345,
            planName: "Plan Name",
            missingEmployerFlyer: true,
            states: [],
        },
    ],
};

describe("PreviewProposalComponent", () => {
    let component: PreviewProposalComponent;
    let fixture: ComponentFixture<PreviewProposalComponent>;
    let staticService: StaticService;
    let staticUtilService: StaticUtilService;
    const formBuilder = new FormBuilder();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
            declarations: [PreviewProposalComponent],
            providers: [
                FormBuilder,
                Store,
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
                    useValue: data,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                StaticService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PreviewProposalComponent);
        component = fixture.componentInstance;
        staticService = TestBed.inject(StaticService);
        staticUtilService = TestBed.inject(StaticUtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should set memberId and mpGroup", () => {
            const mockStatesData: Observable<CountryState[]> = of([
                {
                    abbreviation: "NY",
                    name: "NewYork",
                },
            ]);

            const spy = jest.spyOn(staticService, "getStates").mockReturnValue(mockStatesData);
            component.ngOnInit();
            expect(component.allStates).toHaveLength(1);
            expect(spy).toBeCalled();
        });

        it("should set config", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });

        it("should set config", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("onSubmit", () => {
        const mockFormData = formBuilder.group({
            state: ["NewYork"],
            zip: ["10001"],
            proposalType: ["FULL"],
        });
        it("should set the data with the form values", () => {
            component.data.name = "test";
            const spy = jest.spyOn(mockMatDialogRef, "close");
            component.onSubmit(mockFormData);
            expect(component.data.name).toStrictEqual("test");
            expect(component.data.state).toStrictEqual("NewYork");
        });
        it("should close the mat dialog", () => {
            const spy = jest.spyOn(mockMatDialogRef, "close");
            component.onSubmit(mockFormData);
            expect(spy).toBeCalled();
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
