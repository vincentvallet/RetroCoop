const roman: Record<string, string> = {i:'1',ii:'2',iii:'3',iv:'4',v:'5',vi:'6',vii:'7',viii:'8',ix:'9',x:'10',xi:'11',xii:'12'};

export function normalizeCoverTitle(input: string) {
  let value = input.replace(/\.(png|jpe?g|webp)$/i, '').trim();
  value = value.replace(/^(.+),\s*The$/i, 'The $1');
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bspeedworld\b/g,'speed world')
    .replace(/\bpowermonger\b/g,'power monger')
    .replace(/\s+_\s+/g, ' and ')
    .replace(/[’‘`´]/g, "'")
    .replace(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\b/g, token => roman[token] ?? token)
    .replace(/(^|\s)'(?=\d{2}\b)/g, '$1')
    .replace(/&/g, ' and ')
    .replace(/\bversus\b/g, ' vs ')
    .replace(/\bf[\s-]*1\b/g, 'f1')
    .replace(/\band\b/g, ' and ')
    .replace(/\//g, ' and ')
    .replace(/\b(mega drive|megadrive|genesis)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
}

export function titleTokens(input: string) { return new Set(normalizeCoverTitle(input).split(' ').filter(Boolean)); }

export function stableCoverSlug(input: string) { return normalizeCoverTitle(input).replace(/\s+/g, '-'); }
