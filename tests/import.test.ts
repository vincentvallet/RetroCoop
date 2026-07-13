import {describe,it,expect} from 'vitest';
import {parseCsv,normalize,run} from '../scripts/import-catalog';
import fs from 'node:fs';

describe('import',()=>{
  it('détecte deux séparateurs',()=>{expect(parseCsv('Titre;Joueurs max\nA;2')).toHaveLength(1);expect(parseCsv('Titre,Joueurs max\nA,2')).toHaveLength(1)});
  it('normalise accents et apostrophes',()=>expect(normalize('L’Été')).toBe('l ete'));
  it('parse le TXT réel et reste idempotent sans modifier le catalogue validé',()=>{
    const file='data/normalized/megadrive-games.json',original=fs.readFileSync(file,'utf8');
    try{const a=run();const before=fs.readFileSync(file,'utf8');const b=run();expect(a.length).toBeGreaterThan(300);expect(b.length).toBe(a.length);expect(fs.readFileSync(file,'utf8')).toBe(before)}finally{fs.writeFileSync(file,original)}
  });
  it('génère un rapport de conflits',()=>expect(fs.existsSync('data/reports/conflicts-to-review.csv')).toBe(true));
});
