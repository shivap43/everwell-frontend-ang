/* eslint-disable max-classes-per-file */

import { QleOeShopModel } from "./dual-plan-year.model";

export class IsQleShop {
    static readonly type = "[DualPlanYear] isQleShop";
    constructor(public payload: QleOeShopModel) {}
}

export class SelectedShop {
    static readonly type = "[DualPlanYear] selectedShop";
    constructor(public selectedShop: string) {}
}

export class ResetDualPlanYear {
    static readonly type = "[DualPlanYear] resetDualPlanYear";
}
