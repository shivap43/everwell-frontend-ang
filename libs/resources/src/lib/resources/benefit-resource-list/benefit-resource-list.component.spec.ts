import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BenefitResourceListComponent } from "./benefit-resource-list.component";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
    mockMatDialog,
    mockMatBottomSheet,
    mockDocumentApiService,
    mockUserService,
    mockLanguageService,
    mockStore,
    mockUtilService,
    mockBenefitsOfferingService,
    mockCoreService,
    mockMpGroupAccountService,
    mockMemberService,
    mockShoppingService,
    mockMatDialogRef,
} from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { BenefitsOfferingService, CoreService, DocumentApiService, MemberService, Resource, ShoppingService } from "@empowered/api";
import { UserService } from "@empowered/user";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { LoadResources, RemoveResource, UtilService } from "@empowered/ngxs-store";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { MPGroupAccountService } from "@empowered/common-services";
import { MatPaginator } from "@angular/material/paginator";
import { Subscription, of } from "rxjs";
import { MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[hasAnyPermission]",
})
class MockHasAnyPermissionDirective {
    @Input("hasAnyPermission") permission: string;
}
@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

@Component({
    selector: "mat-paginator",
    template: "",
})
class MockMatPaginatorComponent {
    @Input() pageSizeOptions: number[];
    getNumberOfPages(): number {
        return 2;
    }
}
const mockPaginator = {} as MatPaginator;

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

describe("BenefitResourceListComponent", () => {
    let component: BenefitResourceListComponent;
    let fixture: ComponentFixture<BenefitResourceListComponent>;
    let paginator: MatPaginator;
    let store: Store;
    let dialog: MatDialog;
    let matBottomSheetRef: MatBottomSheetRef;
    let bottomSheet: MatBottomSheet;

    const mockResource = {
        carrierId: 1,
        carrierName: "Aflac",
        description: "r",
        documentId: 15,
        documentName: "Your Rate Sheet_09-13-2023.pdf",
        fileType: "PDF",
        id: 14,
        name: "r",
        productId: 1,
        productName: "Accident",
        readOnly: false,
        resourceType: "FILE",
        type: "BENEFIT",
        visibilityValidity: {
            effectiveStarting: "2023-10-03",
        },
    } as Resource;

    const mockBottomSheetRef = {
        dismiss: () => {},
        afterDismissed: () => of({}),
    } as MatBottomSheetRef;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                BenefitResourceListComponent,
                MockReplaceTagPipe,
                MockMatPaginatorComponent,
                MockHasPermissionDirective,
                MockHasAnyPermissionDirective,
                MockMatFormFieldComponent,
            ],
            providers: [
                FormBuilder,

                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: MatBottomSheet, useValue: mockMatBottomSheet },
                { provide: MatBottomSheetRef, useValue: mockBottomSheetRef },
                { provide: DocumentApiService, useValue: mockDocumentApiService },
                { provide: UserService, useValue: mockUserService },
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: Store, useValue: mockStore },
                { provide: UtilService, useValue: mockUtilService },
                { provide: BenefitsOfferingService, useValue: mockBenefitsOfferingService },
                { provide: CoreService, useValue: mockCoreService },
                { provide: MPGroupAccountService, useValue: mockMpGroupAccountService },
                { provide: MemberService, useValue: mockMemberService },
                { provide: ShoppingService, useValue: mockShoppingService },
                { provide: MatPaginator, useValue: mockPaginator },
                TitleCasePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [NgxsModule.forRoot([]), ReactiveFormsModule, CommonModule, MatTableModule, FormsModule, MatMenuModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BenefitResourceListComponent);
        component = fixture.componentInstance;
        paginator = TestBed.inject(MatPaginator);
        dialog = TestBed.inject(MatDialog);
        matBottomSheetRef = TestBed.inject(MatBottomSheetRef);
        bottomSheet = TestBed.inject(MatBottomSheet);
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onRemove()", () => {
        it("should open remover resource modal and after close it should dispatch action and call listResources()", (done) => {
            const matDialogRef = {
                afterClosed: () => of(mockResource),
            } as MatDialogRef<any>;

            const spy = jest.spyOn(dialog, "open").mockReturnValue(matDialogRef);
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component, "listResources");
            component.onRemove(mockResource);
            matDialogRef.afterClosed().subscribe((res) => {
                expect(spy).toBeCalled();
                expect(spy1).toBeCalledWith(new RemoveResource(res.id));
                expect(spy2).toBeCalled();
                done();
            });
        });
    });

    describe("addResource()", () => {
        it("should open bottomSheet, and after bottomSheet close, dispatch LoadResource action and call listResources()", (done) => {
            const spy = jest.spyOn(bottomSheet, "open").mockReturnValue(matBottomSheetRef);
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component, "listResources");
            component.addResource();
            matBottomSheetRef.afterDismissed().subscribe(() => {
                expect(spy).toBeCalled();
                expect(spy1).toBeCalledWith(new LoadResources());
                expect(spy2).toBeCalled();
                done();
            });
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
