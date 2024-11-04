export type EnvironmentConfiguration = "DEV" | "PROD";

export interface EnvironmentVariables {
    configuration: EnvironmentConfiguration;
    production: boolean;
    hmr: boolean;
}
