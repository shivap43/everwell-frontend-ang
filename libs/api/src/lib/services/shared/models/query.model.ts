export type Query = Search & Filter & Paginate;

export interface Search {
    property: string;
    value: string;
}

export interface Filter {
    filter: string;
}

export interface Paginate {
    page: string;
    size: string;
}
