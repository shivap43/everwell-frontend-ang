import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class NumberOrdinalService {
    /**
     * source: https://stackoverflow.com/a/31615643/9115419
     *
     * Returns the ordinal date(DD),
     * for v < 20 the index is negative and returns number (n) ending in 1, 2, and 3 get "st", "nd", "rd"
     * except for numbers ending in 11, 12, and 13 for which it returns "th"
     *
     * @param n {number} day
     * @returns string
     */
    getNumberWithOrdinal(n: number): string {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
}
