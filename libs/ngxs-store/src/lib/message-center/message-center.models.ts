import { Thread, BoxType, Message, Comment, CategorizedMessage } from "@empowered/api";

export interface BoxTypeThreads {
    boxType: BoxType;
    threads: Thread[];
}

export interface ThreadMessages {
    threadId: number;
    messages: (Message | CategorizedMessage)[];
}

export interface ThreadComments {
    threadId: number;
    comments: Comment[];
}
