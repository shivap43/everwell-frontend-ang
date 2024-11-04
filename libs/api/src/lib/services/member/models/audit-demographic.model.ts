export interface AuditDemographic {
    content: Content[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: string;
    size: number;
    sort: Sort;
    totalElements: number;
    totalPages: number;
}

export interface Content {
    changeType: string;
    field: string;
    newValue: string;
    oldValue: string;
    on: string;
    updateAdmin?: UpdateAdmin;
}
interface Sort {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}
interface UpdateAdmin {
    producerId?: number;
    name?: string;
}
