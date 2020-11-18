export interface IForgeSession {
    oauth2: IOAuth2;
}

export interface IForgePassportSession {
  session: {
    oauth2: {
      forge: IOAuthTemplate;
    };
    passport: {
      user: any;
    };
  };
}

interface IOAuth2 {
    auto_refresh: boolean;
    client_id: string;
    client_secret: string;
    expires_at: string;
    redirect_uri: string;
    scope: string;
}

export interface IOAuthTemplate {
    authName: string;
    authentication: {
      authorizationUrl: string;
      refreshTokenUrl: string;
      scopes: {
        'account:read': string;
        'account:write': string;
        'bucket:create': string;
        'bucket:delete': string;
        'bucket:read': string;
        'bucket:update': string;
        'code:all': string;
        'data:create': string;
        'data:read': string;
        'data:search': string;
        'data:write': string;
        'user-profile:read': string;
        'viewables:read': string;
      };
      tokenUrl: string;
    };
    autoRefresh: boolean;
    basePath: string;
    clientId: string;
    clientSecret: string;
    credentials: {
      expires_at: string;
    };
    redirectUri: string;
    scope: string;
}

export interface IUser {
  userId: string;
  userName: string;
  emailId: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  '2FaEnabled': boolean;
  countryCode: string;
  language: string;
  optin: boolean;
  lastModified: string;
  profileImages: {
    sizeX20: string;
    sizeX40: string;
    sizeX50: string;
    sizeX58: string;
    sizeX80: string;
    sizeX120: string;
    sizeX160: string;
    sizeX176: string;
    sizeX240: string;
    sizeX360: string;
  };
  ldapInfo: {
    ldapEnabled: boolean;
    domainName: string;
  };
  socialUserInfoList: string[];
  twoFactorAuthType: string;
  contactMode: string;
  createdDate: string;
}

export interface IPassportUser {
  user: {
    access_token: string;
    refresh_token: string;
  };
}

export interface ISession {
  email: string;
  fullName: string;
  picture: string;
}
