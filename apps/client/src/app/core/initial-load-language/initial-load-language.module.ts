import { APP_INITIALIZER, NgModule } from "@angular/core";
import { EMPOWERED_LANGUAGE_FACTORY, InitialLoadLanguageService } from "./initial-load-language.service";

@NgModule({
    imports: [],
    providers: [
        {
            provide: APP_INITIALIZER,
            deps: [InitialLoadLanguageService],
            useFactory: EMPOWERED_LANGUAGE_FACTORY,
            multi: true,
        },
    ],
})
export class InitialLoadLanguageModule {}
