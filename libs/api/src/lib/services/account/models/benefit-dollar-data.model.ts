import { Region } from "../../account-profile";
import { ClassNames } from "../../member";
import { FlexDollar } from "./flex-dollar.model";
import { PayFrequency, Product } from "@empowered/constants";

export interface BenefitDollarData {
    currentOffering: FlexDollar;
    allClasses: ClassNames[];
    allRegions: Region[];
    allProducts: Product[];
    payFrequency: PayFrequency;
    payFrequencies: PayFrequency[];
}
