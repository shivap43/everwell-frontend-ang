import { DualPlanYearSettings, GetCartItems, GroupedCartItems } from "@empowered/constants";

export class mockDualPlanYearService {
    getReferenceDate() {
        return "2021-09-01";
    }
    groupCartItems(cartItems: GetCartItems[]): GroupedCartItems {
        return {} as GroupedCartItems;
    }
    checkCartItems(cartItems: GetCartItems[], memberId?: number, mpGroupId?: number, selectedShop?: string) {
        return "";
    }
    setSelectedShop(selectedShop: DualPlanYearSettings): void {}
}
