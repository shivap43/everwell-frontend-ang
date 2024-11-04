import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LanguageDirective } from "./directives/languages.directive";
import { ReplaceTagPipe } from "./pipes/replace-tag.pipe";
import { LanguageService } from "./services/language.service";
import { LanguageStoreModule } from "./state/language.store.module";

@NgModule({
    imports: [CommonModule, LanguageStoreModule],
    exports: [CommonModule, LanguageDirective, ReplaceTagPipe],
    declarations: [LanguageDirective, ReplaceTagPipe],
    providers: [LanguageService],
})
export class LanguageModule {}
