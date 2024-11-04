import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { Subscription } from "rxjs";
import { BeneficiaryComponent } from "./beneficiary.component";
import { DatePipe } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NgModule, Pipe, PipeTransform } from "@angular/core";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { BeneficiaryModel, MemberBeneficiary } from "@empowered/constants";

@NgModule({
    imports: [MatDialogModule],
})
class MockMatDialogModule {}

@NgModule({
    imports: [MatBottomSheetModule],
})
class MockMatBottomSheetModule {}

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Pipe({
    name: "optionFilter",
})
export class MockOptionFilterPipe implements PipeTransform {
    transform(options: any, selection: any, index: number) {
        return "Savings";
    }
}

describe("BeneficiaryComponent", () => {
    let component: BeneficiaryComponent;
    let fixture: ComponentFixture<BeneficiaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BeneficiaryComponent, MockMonSpinnerComponent, MockRichTooltipDirective, MockOptionFilterPipe],
            providers: [DatePipe, FormBuilder, Overlay],
            imports: [
                ReactiveFormsModule,
                NgxsModule.forRoot(),
                HttpClientTestingModule,
                RouterTestingModule,
                MockMatDialogModule,
                MockMatBottomSheetModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BeneficiaryComponent);
        component = fixture.componentInstance;
        component.planObject = {
            application: {
                appData: { planId: 1 },
                carrierId: 65,
                cartData: {},
            },
            steps: [{ id: 1 }],
        };

        jest.spyOn(BeneficiaryComponent.prototype, "checkAflacAlways").mockImplementation();
        fixture.detectChanges();
    });

    it("should create", async () => {
        expect(component).toBeTruthy();
    });

    describe("validate member beneficiary", () => {
        let mockMemberBeneficiary: MemberBeneficiary;

        beforeAll(() => {
            mockMemberBeneficiary = {
                relationshipToMember: "mother",
                type: "",
            };
        });
        it("should return true for the given member beneficiary", () => {
            const isValidMemberBeneficiaryResult = component.isValidMemberBeneficiary(mockMemberBeneficiary);
            expect(isValidMemberBeneficiaryResult).toBeTruthy();
        });
    });

    describe("validate beneficiary model", () => {
        let mockBeneficiaryModel: BeneficiaryModel;

        beforeAll(() => {
            mockBeneficiaryModel = {
                name: "John Doe",
                phone: "1234",
                city: "Buffalo",
                address1: "abc street",
                state: "NY",
                zip: "10001",
            };
        });

        it("should return John Doe as the beneficiary name", () => {
            const selectedBeneficiaryNameResult = component.getSelectedBeneficiaryName(mockBeneficiaryModel);
            expect(selectedBeneficiaryNameResult).toBe(mockBeneficiaryModel.name);
        });

        it("should true for valid beneficiary", () => {
            const isBeneficiaValidResult = component.isBeneficiaryValid(mockBeneficiaryModel);
            expect(isBeneficiaValidResult).toBeTruthy();
        });
    });

    describe("ngOnDestroy", () => {
        it("should unsubscribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
