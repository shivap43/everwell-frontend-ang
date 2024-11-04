import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { AddressVerificationComponent, validateStateAndZipCode } from "./address-verification.component";
import { StaticService } from "@empowered/api";
import { SharedService } from "@empowered/common-services";
import { Observable, of } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import { mockSharedService, mockStaticService } from "@empowered/testing";

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<AddressVerificationComponent, any>;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
};

const matDialogData = {
    suggestedAddress: {},
    providedAddress: {},
    addressResp: true,
    addressMessage: "",
    option: "bothOption",
    errorStatus: 503,
};

describe("AddressVerificationComponent", () => {
    let component: AddressVerificationComponent;
    let fixture: ComponentFixture<AddressVerificationComponent>;
    let mockDialog: MatDialogRef<AddressVerificationComponent, any>;
    let staticService: StaticService;
    let sharedService: SharedService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddressVerificationComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: matDialogData,
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
                    provide: SharedService,
                    useValue: mockSharedService,
                },
            ],
            imports: [ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressVerificationComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialogRef);
        staticService = TestBed.inject(StaticService);
        sharedService = TestBed.inject(SharedService);
        fixture.detectChanges();
        component.verifyAddressForm = new FormGroup({
            selectAddress: new FormControl("suggestedAddress", [Validators.required]),
        });
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize component", () => {
            const spy = jest.spyOn(component, "initializeVerificationForm");
            component.ngOnInit();
            expect(spy).toBeCalledWith("suggestedAddress");
            expect(component.errorStatus).toBeTruthy();
        });
    });

    describe("initializeVerificationForm()", () => {
        it("should initialize verifyAddressForm", () => {
            const option = "suggestedAddress";
            component.initializeVerificationForm(option);
            expect(component.verifyAddressForm.valid).toBeTruthy();
            expect(component.verifyAddressForm.value.selectAddress).toEqual(option);
        });
    });

    describe("close()", () => {
        it("should close address-verify modal with isVerifyAddress false", () => {
            const spy = jest.spyOn(mockDialog, "close");
            component.close();
            expect(spy).toBeCalledWith({
                data: { isVerifyAddress: false, selectedAddress: component.verifyAddressForm.value.selectAddress },
            });
            expect(component.data.addressResp).toBeFalsy();
        });
    });

    describe("afterVerifyAddress()", () => {
        it("should close address-verify modal with isVerifyAddress true", () => {
            const spy = jest.spyOn(mockDialog, "close");
            component.afterVerifyAddress();
            expect(spy).toBeCalledWith({ data: { isVerifyAddress: true, selectedAddress: "suggestedAddress" } });
        });
    });

    describe("validateStateAndZipCode()", () => {
        it("should call validateStateZip API when 9 digit ZIP code is passed", () => {
            expect.assertions(1);
            const spy = jest.spyOn(staticService, "validateStateZip").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            const state = "GA";
            const zip = "310090001";
            const formControl = new FormGroup({
                zip: new FormControl("", [Validators.required]),
            });
            validateStateAndZipCode(state, zip, formControl, staticService, sharedService);
            expect(spy).toBeCalledWith("GA", "310090001");
        });
    });

    describe("validateStateAndZipCode() zip invalid", () => {
        it("should not call validateStateZip API when ZIP code length is not either 5,9 or 10", () => {
            expect.assertions(1);
            const spy = jest.spyOn(staticService, "validateStateZip").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            const state = "AZ";
            const zip = "31009001";
            const formControl = new FormGroup({
                zip: new FormControl("", [Validators.required]),
            });
            validateStateAndZipCode(state, zip, formControl, staticService, sharedService);
            expect(spy).toBeCalledTimes(0);
        });
    });

    describe("validateStateAndZipCode() state invalid", () => {
        it("should not call validateStateZip API when state is empty", () => {
            expect.assertions(1);
            const spy = jest.spyOn(staticService, "validateStateZip").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            const state = "";
            const zip = "31009";
            const formControl = new FormGroup({
                zip: new FormControl("", [Validators.required]),
            });
            validateStateAndZipCode(state, zip, formControl, staticService, sharedService);
            expect(spy).toBeCalledTimes(0);
        });
    });
});
