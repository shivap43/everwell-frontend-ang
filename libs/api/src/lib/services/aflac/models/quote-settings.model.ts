export interface QuoteSettings {
    age?: number;
    gender?: string;
    tobaccoUser?: boolean;
    state?: string;
    riskClassId?: number;
    annualSalary?: number;
    hoursPerYear?: number;
    hourlyWage?: number;
    spouseAge?: number;
    spouseGender?: string;
    spouseTobaccoUser?: boolean;
    numberDependentsExcludingSpouse?: number;
    childAge?: number;
    payrollFrequencyId?: number;
    partnerAccountType?: string;
    sicCode?: number;
    zipCode?: string;
    eligibleSubscribers?: number;
}

export interface QuoteSettingsSchema extends QuoteSettings {
    state?: string;
    channel?: string;
    payFrequency?: string;
    riskClass?: string;
    salarySelection?: string;
    hourlyRate?: number;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    hourlyAnnually?: number;
}
