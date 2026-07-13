const configuredBase=(process.env.NEXT_PUBLIC_MEDIA_BASE_URL??'').trim().replace(/\/$/,'');

export function isPreparedMedia(path:string){return /^\/(covers|gameplay|media)\//.test(path)}
export function resolveGameMediaUrl(path:string){const normalized=path.startsWith('/')?path:`/${path}`;return configuredBase&&isPreparedMedia(normalized)?`${configuredBase}${normalized}`:normalized}
export const mediaUrl=resolveGameMediaUrl;
