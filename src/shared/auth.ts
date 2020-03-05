export interface IForgeSession {
    oauth2: IOAuth2;
}

interface IOAuth2 {
    auto_refresh: boolean;
    client_id: string;
    client_secret: string;
    expires_at: string;
    redirect_uri: string;
    scope: string[];
}
