import { Buffer } from 'buffer';

import { ISession } from '../../shared/auth';

export function encodeBase64(urn: string): string {
    const base64Urn = Buffer.from(urn).toString('base64');
    return base64Urn;
}

export function validateSession(storageVariable: string): boolean {
   const userObject = JSON.parse(storageVariable) as ISession;
    if (userObject) {
        const retrievedEmail = String(userObject.email);
        if (retrievedEmail.includes('@')) { return true; }
        return false;
    }
    return false;
}