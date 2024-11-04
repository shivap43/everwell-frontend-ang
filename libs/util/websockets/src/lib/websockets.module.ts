import { NgModule } from "@angular/core";
import { RxStompService } from "@stomp/ng2-stompjs";

@NgModule({
    providers: [RxStompService],
})
export class WebsocketsModule {}
