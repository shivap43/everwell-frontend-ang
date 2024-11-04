export interface Product {
    id: number;
    name: string;
    code: string;
    adminName?: string;
    displayOrder?: number;
    valueAddedService?: boolean;
    description?: string;
    carrierName?: string;
    carrierIds?: number[];
    iconLocation?: string;
    iconSelectedLocation?: string;
    cardColorCode?: string;
    productId?: number;
    legalName?: string;
    missingEmployerFlyer?: boolean;
}
