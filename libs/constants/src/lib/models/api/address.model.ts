export interface Address {
    address1?: string;
    address2?: string;
    city?: string;
    state: string;
    zip: string;
    countyId?: number;
    /**
     * @description one of /static/countries
     */
    country?: string;
}
