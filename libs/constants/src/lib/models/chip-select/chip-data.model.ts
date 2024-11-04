/**
 * Interface to build a chip (drop) option.
 */
export interface ChipData {
    name: string; // something
    value: string; // 123
    parentValue?: string;
    required?: boolean; // if true, the chip is not removable
}
