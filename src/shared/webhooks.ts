export interface IWebHookData {
    hookId: string;
    callbackUrl: string;
    createdBy: string;
    createdDate: string;
    event: string;
    scope: any;
    status: string;
    urn: string;
    hubId: string;
    projectId: string;
    __self__: string;
}

export interface IWebHooks {
    links: {
        next: string;
    };
    data: IWebHookData[];
}

export interface IWebHook {
    hooks: IWebHookData[];
}

export interface IWebHookPayload {
    TimeStamp: string;
    Env: string;
    URN: string;
    EventType: string;
    Payload: {
        status: string;
        scope: string;
        registerKey: [];
    };
}

export interface IWebHookCallback {
    version: string;
    resourceUrn: string;
    hook: {
        hookId: string;
        tenant: string;
        callbackUrl: string;
        createdBy: string;
        event: string;
        createdDate: string;
        system: string;
        creatorType: string;
        status: string;
        scope: {
            workflow: string;
        };
        urn: string;
        __self__: string;
    };
    payload: IWebHookPayload;
}