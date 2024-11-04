import { RiskClass, CountryState, Gender } from "@empowered/constants";

export const mockCountryStates: CountryState[] = [
    {
        abbreviation: "AZ",
        name: "Arizona",
    },
    {
        abbreviation: "CA",
        name: "California",
    },
];

export const mockCities: string[] = [
    "Aberdeen",
    "Advance",
    "Ahoskie",
    "Alamance",
    "Albemarle",
    "Albertson",
    "Alexander",
    "Alexis",
    "Alliance",
];

export const mockCountries: string[] = ["USA"];

export const mockGenders: Gender[] = [Gender.FEMALE, Gender.MALE];

export const mockRiskClasses: RiskClass[] = [
    {
        name: "risk class 1",
        id: 1,
    },
    {
        name: "risk class 2",
        id: 2,
    },
];
