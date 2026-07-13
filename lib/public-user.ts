export type PublicUser={id:string;username:string};
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function maskedEmail(value:string){const [name='',domain='']=value.trim().split('@');return domain?`${name.slice(0,1)||'*'}***@${domain}`:'Utilisateur RetroCoop'}
export function publicUsername(username:string|null|undefined,email?:string|null){const value=username?.trim();if(value&&!emailPattern.test(value))return value;return maskedEmail(value||email||'')}
