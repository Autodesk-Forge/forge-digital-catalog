export function encodeBase64 (urn) {
    const base64Urn = new Buffer.from(urn).toString('base64')
    return base64Urn
}