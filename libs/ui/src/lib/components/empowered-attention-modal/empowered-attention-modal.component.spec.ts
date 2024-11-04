import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { mockMatDialogRef } from "@empowered/testing";

import { EmpoweredAttentionModalComponent } from "./empowered-attention-modal.component";

describe("EmpoweredAttentionModalComponent", () => {
    let component: EmpoweredAttentionModalComponent;
    let fixture: ComponentFixture<EmpoweredAttentionModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EmpoweredAttentionModalComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EmpoweredAttentionModalComponent);
        component = fixture.componentInstance;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
