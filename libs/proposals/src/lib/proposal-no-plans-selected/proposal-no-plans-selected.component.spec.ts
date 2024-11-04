import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { ProposalNoPlansSelectedComponent } from "./proposal-no-plans-selected.component";

describe("ProposalNoPlansSelectedComponent", () => {
    let component: ProposalNoPlansSelectedComponent;
    let fixture: ComponentFixture<ProposalNoPlansSelectedComponent>;
    let mockMatDialog: MatDialogRef<ProposalNoPlansSelectedComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProposalNoPlansSelectedComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProposalNoPlansSelectedComponent);
        component = fixture.componentInstance;
        mockMatDialog = TestBed.inject(MatDialogRef);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeModal()", () => {
        it("should close the matDialog", () => {
            const spy = jest.spyOn(mockMatDialog, "close");
            component.closeModal();
            expect(spy).toBeCalled();
        });
    });
});
