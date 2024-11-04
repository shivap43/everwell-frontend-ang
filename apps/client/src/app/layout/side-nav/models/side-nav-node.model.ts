import { Observable } from "rxjs";
export interface SideNavNode {
    name: string;
    icon?: string;
    route?: string;
    config?: Observable<boolean>;
    permission?: Observable<boolean>;
    children?: SideNavNode[];
}

/** Flat node with expandable and level information */
export interface SideNavFlatNode {
    expandable: boolean;
    name: string;
    route?: string;
    level: number;
}
