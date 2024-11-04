import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MemberService, StaticService } from "@empowered/api";

import { BeneficiaryListComponent } from "./beneficiary-list.component";
import { MockReplaceTagPipe, mockLanguageService, mockStaticUtilService, mockUtilService } from "@empowered/testing";
import { ComponentType } from "@angular/cdk/portal";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { BehaviorSubject, of, Subject } from "rxjs";
import { ActivatedRoute, NavigationExtras, Params, Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { UserService } from "@empowered/user";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, Pipe, PipeTransform } from "@angular/core";
import { BeneficiaryAction, Configurations, MemberBeneficiary } from "@empowered/constants";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MemberBeneficiaryService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { MatMenuModule } from "@angular/material/menu";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({}),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
    selectSnapshot: () => of({}),
};

const mockMpGroup = new BehaviorSubject(45678);
const mockMemberId = new BehaviorSubject(1);
const mockValidators = new BehaviorSubject({});

const mockMemberBeneficiaryService = {
    mpGroup: mockMpGroup,
    memberId: mockMemberId,
    validators: mockValidators,
} as MemberBeneficiaryService;

const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number, partnerId?: string) => of([] as Configurations[]),
} as StaticService;

const mockMemberService = {
    getMemberBeneficiaries: (memberId: number, mpGroup: number, maskSsn: boolean) => of([] as MemberBeneficiary[]),
    deleteMemberBeneficiary: (memberId: number, mpGroup: number, beneficiaryId: number) => of([]),
} as MemberService;

const mockRouteParams = new Subject<Params>();
const mockRoute = {
    parent: { parent: { snapshot: { params: mockRouteParams.asObservable() } } },
};
const mockRouter = {
    navigate: (commands: any[], extras?: NavigationExtras) => {},
};

const mockUserService = {
    credential$: of({}),
} as UserService;

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}
describe("BeneficiaryListComponent", () => {
    let component: BeneficiaryListComponent;
    let fixture: ComponentFixture<BeneficiaryListComponent>;
    let service: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BeneficiaryListComponent, MockMonAlertComponent, MockTitleCasePipe, MockMonSpinnerComponent, MockReplaceTagPipe],
            imports: [MatMenuModule, MatTableModule],
            providers: [
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: MemberBeneficiaryService,
                    useValue: mockMemberBeneficiaryService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BeneficiaryListComponent);
        service = TestBed.inject(MemberService);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("hideErrorAlertMessage()", () => {
        it("should return showErrorMessage value as false", () => {
            component.errorMessage = "";
            component.showErrorMessage = true;
            component.hideErrorAlertMessage();
            expect(component.showErrorMessage).toBeFalsy();
        });
    });

    describe("takeAction()", () => {
        it("should call editBeneficiary method if action is edit", () => {
            const action = "Edit Beneficiary";
            const element = {
                id: 3,
                actions: ["Edit Beneficiary", "Remove Beneficiary"],
            };
            const spy = jest.spyOn(component, "editBeneficiary");
            component.tempAction = BeneficiaryAction;
            component.takeAction(action, element);
            expect(spy).toBeCalledWith(element);
        });

        it("should call removeBeneficiary method if action is remove", () => {
            const action = "Remove Beneficiary";
            const element = {
                id: 3,
                allocations: [],
                actions: ["Edit Beneficiary", "Remove Beneficiary"],
            };
            component.data = {
                data: [
                    {
                        type: "ESTATE",
                        name: {
                            firstName: "My",
                            lastName: "Estate",
                        },
                        relationshipToMember: "-",
                        details: null,
                        allocations: [],
                        contact: null,
                    },
                ] as MemberBeneficiary[],
            } as MatTableDataSource<MemberBeneficiary>;
            const spy = jest.spyOn(component, "removeBeneficiary");
            component.tempAction = BeneficiaryAction;
            component.takeAction(action, element);
            expect(spy).toBeCalledWith(element);
        });

        it("should call goToCovrageSummary method if action is update", () => {
            const action = "Update Allocation";
            const element = {
                id: 3,
                actions: ["Edit Beneficiary", "Remove Beneficiary", "Update Allocation"],
            };
            const spy = jest.spyOn(component, "goToCovrageSummary");
            component.tempAction = BeneficiaryAction;
            component.takeAction(action, element);
            expect(spy).toBeCalledWith(element);
        });
    });

    describe("editBeneficiary()", () => {
        it("should return templateFlag value as false", () => {
            const beneficiary = {
                id: 2,
                type: "INDIVIDUAL",
            };
            component.templateFlag = true;
            component.editBeneficiary(beneficiary);
            expect(component.beneficiaryObjType).toStrictEqual("INDIVIDUAL");
            expect(component.beneficiaryObjId).toStrictEqual(2);
            expect(component.templateFlag).toBeFalsy();
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
