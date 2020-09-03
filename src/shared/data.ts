export interface IDownloadJob {
    type: string;
    id: string;
    attributes: {
        status: string;
    };
    links: {
        self: {
            href: string;
        };
    };
}

export interface IFolderContents {
    jsonapi: {
        version: string;
    };
    links: {
        self: {
            href: string;
        };
    };
    data: IItem[];
}

export interface IItem {
    type: string;
    id: string;
    attributes: {
        name: string;
        displayName: string;
        createTime: string;
        createUserId: string;
        createUserName: string;
        lastModifiedTime: string;
        lastModifiedUserName: string;
        lastModifiedTimeRollup: string;
        objectCount: number;
        hidden: boolean;
        extension: {
            type: string;
            version: string;
            schema: {
                href: string;
            };
        };
    };
    links: {
        self: {
            href: string;
        };
    };
    relationships: {
        contents: {
            links: {
                related: {
                    href: string;
                };
            };
        };
        parent: {
            data: {
                type: string;
                id: string;
            };
            links: {
                related: {
                    href: string;
                };
            };
        };
        refs: {
            links: {
                self: {
                    href: string;
                };
                related: {
                    href: string;
                };
            };
        };
        links: {
            links: {
                self: {
                    href: string;
                };
            };
        };
    };
}

export interface IOSSObject {
    bucketkey?: string;
    objectId?: string;
    objectKey?: string;
    sha1?: string;
    size?: string;
    contentType?: string;
    location?: string;
}
