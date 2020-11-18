export interface IDownloadFormats {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: {
        type: string;
        id: string;
        attributes: {
            formats: {
                fileType: string;
            };
        };
        links: ISelfHref;
    };
}

export interface IDownloadInfo {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: {
        type: string;
        id: string;
        attributes: {
            format: {
                fileType: string;
            };
        };
        relationships: {
            storage: {
                meta: ILinkHref;
                data: IDataIdType;
            };
        };
        links: ISelfHref;
    };
}

export interface IDownloads {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: {
        type: string;
        id: string;
        attributes: {
            status: string;
        };
        links: ISelfHref;
    };
}

export interface IDownloadObject {
    config: any;
    data: Buffer;
    headers: {
        [key: string]: string;
    };
    status: number;
    statusText: string;
}

export interface IHubData {
    type: string;
    id: string;
    attributes: {
        name: string;
        extension: IExtension;
        region: string;
    };
    relationships: {
        projects: {
            links: IRelatedHref;
        };
    };
    links: ISelfHref;
}

export interface IHubs {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: IHubData[];
}

export interface IProjectData {
    type: string;
    id: string;
    attributes: {
        name: string;
        scopes: string[];
        extension: IExtension;
    };
    relationships: {
        hub: {
            links: IRelatedHref;
            data: IDataIdType;
        };
        rootFolder: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        topFolders: {
            links: IRelatedHref;
        };
    };
    links: ISelfHref;
}

export interface IProject {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: IProjectData;
}

export interface IProjects {
    jsonapi: IJsonApi;
    links: ISelfFirstPrevNext;
    data: IProjectData[];
}

export interface ITopFoldersData {
    type: string;
    id: string;
    attributes: {
        name: string;
        displayName: string;
        objectCount: number;
        createTime: string;
        createUserId: string;
        createUserName: string;
        lastModifiedTime: string;
        lastModifiedUserId: string;
        lastModifiedUserName: string;
        hidden: boolean;
        extension: IExtension;
    };
    relationships: {
        parent: {
            links: IRelatedHref;
            data: IDataIdType;
        };
        contents: {
            links: IRelatedHref;
        };
        refs: {
            links: IRef;
        };
        links: {
            links: ISelfHref;
        };
    };
    links: ISelfHref;
}

export interface ITopFolders {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: ITopFoldersData[];
}

export interface IFolderContents {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: IItemData[];
    included: IItemIncluded[];
}

export interface IItemData {
    type: string;
    id: string;
    attributes: {
        displayName: string;
        createTime: string;
        createUserId: string;
        createUserName: string;
        lastModifiedTime: string;
        lastModifiedUserId: string;
        lastModifiedUserName: string;
        hidden: boolean;
        reserved: boolean;
        reservedTime: string;
        reservedUserId: string;
        reservedUserName: string;
        extension: IExtension;
        pathInProject: string;
    };
    relationships: {
        parent: {
            links: IRelatedHref;
            data: IDataIdType;
        };
        tip: {
            links: IRelatedHref;
            data: IDataIdType;
        };
        versions: {
            links: IRelatedHref;
        };
        refs: IRefLinks;
        links: {
            links: ISelfHref;
        };
    };
    links: ISelfHref;
}

export interface IItemIncluded {
    type: string;
    id: string;
    attributes: IAttributes;
    relationships: {
        item: {
            links: IRelatedHref;
            data: IDataIdType;
        };
        refs: IRefLinks;
        links: {
            links: ISelfHref;
        };
        storage: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        derivatives: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        thumbnails: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        downloadFormats: {
            links: IRelatedHref;
        };
    };
    links: ISelfHref;
}

export interface IItem {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: IItemData[];
    included: IItemIncluded[];
}

export interface IItemVersions {
    jsonapi: IJsonApi;
    links: ISelfFirstPrevNext;
    data: IItemVersionData[];
}

export interface IItemVersionData {
    type: string;
    id: string;
    attributes: IAttributes;
    relationships: {
        item: {
            links: IRelatedHref;
            data: IDataIdType;
        };
        refs: {
            links: ISelfHref;
            related: {
                href: string;
            };
        };
        links: {
            links: ISelfHref;
        };
        storage: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        derivatives: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        thumbnails: {
            meta: ILinkHref;
            data: IDataIdType;
        };
        downloadFormats: {
            links: IRelatedHref;
        };
    };
    links: ISelfHref;
}

export interface IItemVersion {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: IItemVersionData;
}

export interface IItemVersionRelationshipsRefs {
    jsonapi: IJsonApi;
    links: IRef;
    data: {
        type: string;
        id: string;
        meta: {
            refType: string;
            direction: string;
            fromId: string;
            fromType: string;
            toId: string;
            toType: string;
            extension: IExtension;
        };
    };
    included: IDataIdType;
}

export interface IItemVersionMetadata {
    derivativeUrn: string;
    designUrn: string;
    fileType: string;
    name: string;
    size: string;
    storageLocation: string;
}

export interface IJobData {
    type: string;
    id: string;
    attributes: {
        status: string;
    };
    links: ISelfHref;
    relationships: {
        storage: {
            meta: ILinkHref;
        };
    };
}

export interface IJob {
    jsonapi: IJsonApi;
    links: ISelfHref;
    data: IJobData[];
}

// Commons

export interface IAttributes {
    name: string;
    displayName: string;
    versionNumber: number;
    mimeType: string;
    fileType: string;
    storageSize: string;
    createTime: string;
    createUserId: string;
    createUserName: string;
    lastModifiedTime: string;
    lastModifiedUserId: string;
    lastModifiedUserName: string;
    extension: IExtension;
}

export interface IDataIdType {
    id: string;
    type: string;
}

export interface IExtension {
    type: string;
    version: string;
    schema: {
        href: string;
    };
    data: any;
}

export interface IJsonApi {
    version: string;
}

export interface ILinkHref {
    link: {
        href: string;
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

export interface IRef {
    self: {
        href: string;
    };
    related: {
        href: string;
    };
}

export interface IRefLinks {
    links: IRef;
}

export interface IRelatedHref {
    related: {
        href: string;
    };
}

export interface ISelfHref {
    self: {
        href: string;
    };
}

export interface ISelfFirstPrevNext {
    self: {
        href: string;
    };
    first: {
        href: string;
    };
    prev: {
        href: string;
    };
    next: {
        href: string;
    };
}

export interface ITypes {
    [key: string]: string;
}