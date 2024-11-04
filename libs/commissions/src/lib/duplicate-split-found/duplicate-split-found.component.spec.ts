/* eslint-disable @typescript-eslint/quotes */
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Store } from "@ngxs/store";
import { DuplicateSplitFoundComponent } from "./duplicate-split-found.component";
import { FormBuilder } from "@angular/forms";
import { AccountService, AflacService, Carrier, CommissionSplit, CoreService, RULE_CONSTANT, State } from "@empowered/api";
import { AccountProducer, Product } from "@empowered/constants";
import { of } from "rxjs";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { HttpClientModule } from "@angular/common/http";
import { provideMockStore } from "@ngrx/store/testing";
import { CommissionSplitsService } from "../commission-splits/commission-splits.service";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from "@angular/core";
import { StaticUtilService } from "@empowered/ngxs-store";

const mockAccountService = {
    getAccountProducers: (mpGroup: string) => of([]),
} as AccountService;

const mockMatDialogRef = { close: () => {} } as MatDialogRef<DuplicateSplitFoundComponent>;

const mockAflacService = {
    createCommissionSplit: (mpGroup: number, customizedSplitObject: CommissionSplit) => of([]),
    deleteCommissionSplit: (mpGroup: number, id: number) => of([]),
} as AflacService;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockStore = {
    selectSnapshot: () => "",
} as unknown as Store;

const mockCoreService = {
    getProducts: () => of([]),
    getCarriers: () => of([]),
} as CoreService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({}),
        } as MatDialogRef<any>),
} as MatDialog;

const mockStaticUtilService = {
    getStates: () => of([]),
} as unknown as StaticUtilService;

const mockCommissionSplitsService = {
    setAction: (action: boolean) => {},
} as CommissionSplitsService;

const mockDialogData = {
    isSameProducer: true,
    existingCommissionSplit: {},
    newCommissionSplit: {},
};

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    selector: "empowered-modal",
    template: "",
})
class MockEmpoweredModalComponent {
    @Input() showCancel: boolean;
}

@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockEmpoweredModalHeaderComponent {}

@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockEmpoweredModalFooterComponent {}
describe("DuplicateSplitFoundComponent", () => {
    let component: DuplicateSplitFoundComponent;
    let fixture: ComponentFixture<DuplicateSplitFoundComponent>;
    let matdialogRef: MatDialogRef<DuplicateSplitFoundComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                DuplicateSplitFoundComponent,
                MockEmpoweredModalHeaderComponent,
                MockEmpoweredModalComponent,
                MockEmpoweredModalFooterComponent,
                MockMonSpinnerComponent,
            ],
            imports: [HttpClientModule],
            providers: [
                FormBuilder,
                DatePipe,
                provideMockStore({}),
                {
                    provide: CommissionSplitsService,
                    useValue: mockCommissionSplitsService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                { provide: Store, useValue: mockStore },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DuplicateSplitFoundComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
        matdialogRef = TestBed.inject(MatDialogRef);
        store = TestBed.inject(Store);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("getProductName()", () => {
        it("Should return product name if product id is same ", () => {
            component.productList = [{ id: 1, name: "Accident" }] as Product[];
            expect(component.getProductName(1)).toStrictEqual("Accident");
        });
        it("Should not return product name if product id is different ", () => {
            component.productList = [{ id: 1, name: "Accident" }] as Product[];
            expect(component.getProductName(2)).toStrictEqual("");
        });
    });

    describe("getCarrierName()", () => {
        it("Should return carrier name if carrier id is same", () => {
            component.carrierList = [{ id: 1, name: "Aflac" }] as Carrier[];
            expect(component.getCarrierName(1)).toStrictEqual("Aflac");
        });
        it("Should not return carrier name if carrier id is different", () => {
            component.carrierList = [{ id: 1, name: "Aflac" }] as Carrier[];
            expect(component.getCarrierName(2)).toStrictEqual("");
        });
    });

    describe("getDisplayTextOfStates()", () => {
        it("Should return state name if state abbreviation is same", () => {
            component.stateList = [{ abbreviation: "CT", name: "Connecticut" }] as State[];
            expect(component.getDisplayTextOfStates("CT")).toStrictEqual("Connecticut");
        });
        it("Should not return state name if state abbreviation is different", () => {
            component.stateList = [{ abbreviation: "DC", name: "District of Columbia" }] as State[];
            expect(component.getDisplayTextOfStates("CT")).toStrictEqual("");
        });
    });

    describe("directToCommissionSplits()", () => {
        it("Should close dialog box when clicked on cancel button", () => {
            const spy = jest.spyOn(matdialogRef, "close");
            component.directToCommissionSplits();
            expect(spy).toBeCalled();
        });
    });
    describe("getRuleDisplayList()", () => {
        it("getRuleDisplayList should call getRulesObject and  getInnerHTML ", () => {
            const spy1 = jest.spyOn(component, "getRulesObject");
            const spy2 = jest.spyOn(component, "getInnerHTML");
            const mockCommissionSplit = {
                id: 1,
                splitCompanyCode: "US",
                rules: [{ id: 3104605, name: "Elena aboudi", producerId: 12822, type: "WRITING_PRODUCER" }],
            } as CommissionSplit;
            component.getRuleDisplayList(mockCommissionSplit);
            expect(spy1).toBeCalledWith({
                id: 1,
                rules: [{ id: 3104605, name: "Elena aboudi", producerId: 12822, type: "WRITING_PRODUCER" }],
                splitCompanyCode: "US",
            });
            expect(spy2).toBeCalledWith("US");
        });
    });
    describe("onCancel()", () => {
        it("should called directToCommissionSplits when clicked on cancel button", () => {
            const spy1 = jest.spyOn(component, "directToCommissionSplits");
            component.onCancel();
            expect(spy1).toBeCalled();
        });
    });

    describe("getSitCodeBySitCodeIdProducerId()", () => {
        it("Should return sitcode wrt to passed producerId and sitCodeId", () => {
            component.producerList = [
                {
                    pendingInvite: false,
                    producer: {
                        id: 9492,
                        // eslint-disable-next-line id-denylist
                        writingNumbers: [{ number: "07441", sitCodes: [{ active: true, code: "25", companyCode: "US", id: 13578 }] }],
                    },
                },
            ] as AccountProducer[];
            const spy1 = jest.spyOn(component, "getProducer");
            const result = component.getSitCodeBySitCodeIdProducerId("9492", 13578);
            expect(spy1).toBeCalledTimes(1);
            expect(spy1).toBeCalledWith(9492);
            expect(result).toStrictEqual("25");
        });
        it("Should not return sitcode If passed producerId or sitCodeId is not matches", () => {
            component.producerList = [];
            const spy1 = jest.spyOn(component, "getProducer");
            const result = component.getSitCodeBySitCodeIdProducerId("9492", 13578);
            expect(spy1).toBeCalledTimes(1);
            expect(spy1).toBeCalledWith(9492);
            expect(result).toStrictEqual("");
        });
    });

    describe("getWritingNumberBySitCode()", () => {
        it("Should return writing number wrt to passed producerId and sitCodeId", () => {
            component.producerList = [
                {
                    pendingInvite: false,
                    producer: {
                        id: 9492,
                        // eslint-disable-next-line id-denylist
                        writingNumbers: [{ number: "07441", sitCodes: [{ active: true, code: "25", companyCode: "US", id: 13578 }] }],
                    },
                },
            ] as AccountProducer[];
            const spy1 = jest.spyOn(component, "getProducer");
            const result = component.getWritingNumberBySitCode("9492", 13578);
            expect(spy1).toBeCalledTimes(1);
            expect(spy1).toBeCalledWith(9492);
            expect(result).toStrictEqual("07441");
        });
        it("Should not return writing number If passed producerId or sitCodeId is not matches", () => {
            component.producerList = [];
            const spy1 = jest.spyOn(component, "getProducer");
            const result = component.getWritingNumberBySitCode("9492", 13578);
            expect(spy1).toBeCalledTimes(1);
            expect(spy1).toBeCalledWith(9492);
            expect(result).toStrictEqual("");
        });
    });

    describe("getRuleDisplayText()", () => {
        it("Should return name if rules type is same", () => {
            component.rulesList = [
                {
                    name: "Montoya Test",
                    type: RULE_CONSTANT.WRITING_PRODUCER,
                },
            ];
            expect(component.getRuleDisplayText("WRITING_PRODUCER")).toStrictEqual("Montoya Test");
        });

        it("Should not return name if rules type is different", () => {
            component.rulesList = [
                {
                    type: RULE_CONSTANT.CARRIER,
                    name: "VSP Individual Vision",
                },
            ];
            expect(component.getRuleDisplayText("PRODUCT")).toStrictEqual("");
        });
    });

    describe("getInnerHTML()", () => {
        it("Should call getRuleDisplayText method if rulesObj length greater than zero", () => {
            component.rulesObj = {
                WRITING_PRODUCER: ["Montoya Test", "Role NinetyOne"],
                PRODUCT: ["Whole Life"],
                STATES: ["Alabama", "Arizona"],
                DATE_WRITTEN: ["2022-09-01"],
                CARRIER: ["Aflac"],
                ENROLLMENT_METHOD: ["FACE_TO_FACE"],
            };
            const spy1 = jest.spyOn(component, "getRuleDisplayText");
            const spy2 = jest.spyOn(component, "getOtherText");
            component.getInnerHTML("US");
            expect(spy1).toBeCalledWith("WRITING_PRODUCER");
            expect(component.writingProducerValue).toStrictEqual(["Montoya Test", "Role NinetyOne"]);
            expect(spy1).toBeCalledWith("PRODUCT");
            expect(component.productValue).toStrictEqual(["Whole Life"]);
            expect(spy1).toBeCalledWith("STATES");
            expect(component.stateValue).toStrictEqual(["Alabama", "Arizona"]);
            expect(spy2).toBeCalledTimes(1);
        });

        it("Should call getRuleDisplayText method if splitCompanyCode is NY", () => {
            component.rulesObj = {
                WRITING_PRODUCER: [],
                PRODUCT: [],
                STATES: ["New York"],
                DATE_WRITTEN: [],
                CARRIER: [],
                ENROLLMENT_METHOD: [],
            };
            component.stateList = [{ abbreviation: "NY", name: "New York" }] as State[];
            const spy1 = jest.spyOn(component, "getRuleDisplayText");
            const spy2 = jest.spyOn(component, "getOtherText");
            const spy3 = jest.spyOn(component, "getDisplayTextOfStates");
            component.getInnerHTML("NY");
            expect(spy1).toBeCalledWith("STATES");
            expect(spy3).toBeCalledWith("NY");
            expect(component.stateValue).toStrictEqual(["New York"]);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("getRulesObject()", () => {
        it("getRulesObject method should return RulesObject which contains writing producer names", () => {
            const commissionSplit = {
                rules: [
                    {
                        type: "WRITING_PRODUCER",
                        id: 99239,
                        producerId: 9492,
                        name: "Montoya Test",
                    },
                    {
                        type: "WRITING_PRODUCER",
                        id: 99240,
                        producerId: 9495,
                        name: "Role NinetyOne",
                    },
                ],
            };

            const spy1 = jest.spyOn(component, "getProducer");
            component.producerList = [
                {
                    pendingInvite: false,
                    producer: {
                        id: 9492,
                        name: {
                            firstName: "Rajeshwari",
                            middleName: "",
                            lastName: "Lahoti",
                        },
                        // eslint-disable-next-line id-denylist
                        writingNumbers: [{ number: "07441", sitCodes: [{ active: true, code: "25", companyCode: "US", id: 13578 }] }],
                    },
                },
            ] as AccountProducer[];
            const result = component.getRulesObject(commissionSplit as CommissionSplit);
            expect(result).toStrictEqual({
                CARRIER: [],
                DATE_WRITTEN: [],
                ENROLLMENT_METHOD: [],
                PRODUCT: [],
                STATES: [],
                WRITING_PRODUCER: ["Rajeshwari Lahoti"],
            });
            expect(spy1).toBeCalledTimes(2);
            expect(component.writingProducerLength).toStrictEqual(2);
        });

        it("getRulesObject method should return RulesObject which contains product names ", () => {
            const commissionSplit = {
                rules: [
                    {
                        type: "PRODUCT",
                        id: 16304,
                        productId: 28,
                        name: "Whole Life",
                    },
                ],
            };

            const spy1 = jest.spyOn(component, "getProductName");
            component.productList = [{ id: 28, name: "Whole Life" }] as Product[];
            const result = component.getRulesObject(commissionSplit as CommissionSplit);
            expect(result).toStrictEqual({
                CARRIER: [],
                DATE_WRITTEN: [],
                ENROLLMENT_METHOD: [],
                PRODUCT: ["Whole Life"],
                STATES: [],
                WRITING_PRODUCER: [],
            });
            expect(spy1).toBeCalledTimes(1);
            expect(component.productLength).toStrictEqual(1);
        });
        it("getRulesObject method should return RulesObject which contains carrier names ", () => {
            const commissionSplit = {
                rules: [
                    {
                        type: "CARRIER",
                        id: 16327,
                        carrierId: 1,
                        name: "Aflac",
                    },
                ],
            };

            const spy1 = jest.spyOn(component, "getCarrierName");
            component.carrierList = [{ id: 1, name: "Aflac" }] as Carrier[];
            const result = component.getRulesObject(commissionSplit as CommissionSplit);
            expect(spy1).toBeCalledTimes(1);
            expect(result).toStrictEqual({
                CARRIER: ["Aflac"],
                DATE_WRITTEN: [],
                ENROLLMENT_METHOD: [],
                PRODUCT: [],
                STATES: [],
                WRITING_PRODUCER: [],
            });
            expect(component.careerLength).toStrictEqual(1);
        });
    });
});
