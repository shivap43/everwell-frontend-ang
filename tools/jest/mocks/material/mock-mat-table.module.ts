import { NgModule } from "@angular/core";
import { MockComponent, MockDirective } from "@empowered/jest";

const MockMatTable = MockComponent("mat-table, table[mat-table]", {
    exportAs: "matTable",
    inputs: ["dataSource", "multiTemplateDataRows", "trackBy"],
}) as any;

const MockMatHeaderRow = MockComponent("mat-header-row, tr[mat-header-row]", {
    exportAs: "matHeaderRow",
}) as any;

const MockMatHeaderCellDef = MockDirective("[matHeaderCellDef]", {
    inputs: ["name", "sticky", "stickyEnd"],
}) as any;

const MockMatHeaderRowDef = MockDirective("[matHeaderRowDef]", {
    inputs: ["sticky"],
}) as any;

const MockMatColumnDef = MockDirective("[matColumnDef]", {
    inputs: ["name", "sticky", "stickyEnd"],
}) as any;

const MOCK_DECLARATIONS = [MockMatTable, MockMatHeaderRow, MockMatHeaderCellDef, MockMatHeaderRowDef, MockMatColumnDef];

export const MockMatTableModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
