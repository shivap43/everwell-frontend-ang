import { MenuItem } from "./menu-item.model";

export interface MonSideNavList {
    menuIntem: MenuItem;
    subMenuItem: MenuItem[];
    businessExpand?: boolean;
    hireDateClause?: boolean;
}
