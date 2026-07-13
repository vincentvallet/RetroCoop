const configuredBase=(process.env.NEXT_PUBLIC_MEDIA_BASE_URL??'').trim().replace(/\/$/,'');

export function isPreparedMedia(path:string){return /^\/(covers|gameplay)\//.test(path)}
export function mediaUrl(path:string){return configuredBase&&isPreparedMedia(path)?`${configuredBase}${path}`:path}
