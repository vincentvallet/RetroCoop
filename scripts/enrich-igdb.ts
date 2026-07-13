import fs from 'node:fs';
import path from 'node:path';
import {IgdbProvider} from '../lib/metadata/igdb-provider';
import {scoreMetadataMatch} from '../lib/metadata/matching';

type StoredGame = {title: string; slug: string; releaseYear: number | null; playerMax: number | null; coverUrl?: string | null; [key: string]: unknown};
type Report = {total: number; alreadyComplete: number; updated: number; ambiguous: number; notFound: number; failed: number; missingCovers: string[]; ambiguousMatches: {game: string; candidate: string; confidence: number; reasons: string[]}[]; errors: {game: string; error: string}[]};

export function parseOptions(argv: string[]) {
  const value = (name: string) => argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  return {dryRun: argv.includes('--dry-run'), force: argv.includes('--force'), limit: Number(value('limit') || 0), game: value('game')};
}

export async function enrich(argv = process.argv.slice(2)) {
  const options = parseOptions(argv);
  const file = path.resolve('data/normalized/megadrive-games.json');
  const games = JSON.parse(fs.readFileSync(file, 'utf8')) as StoredGame[];
  const selected = games.filter(game => !options.game || game.title.toLocaleLowerCase('fr') === options.game.toLocaleLowerCase('fr')).slice(0, options.limit || undefined);
  const report: Report = {total: games.length, alreadyComplete: 0, updated: 0, ambiguous: 0, notFound: 0, failed: 0, missingCovers: [], ambiguousMatches: [], errors: []};
  const clientId = process.env.IGDB_CLIENT_ID;
  const secret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !secret) {
    for (const game of selected) { if (!game.coverUrl) report.missingCovers.push(game.title); }
    fs.mkdirSync('data/reports', {recursive: true});
    fs.writeFileSync('data/reports/metadata-report.json', `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
    console.log('IGDB non interrogé : renseignez IGDB_CLIENT_ID et IGDB_CLIENT_SECRET. Aucun fichier catalogue modifié.');
    return report;
  }
  const provider = new IgdbProvider(clientId, secret);
  for (const game of selected) {
    if (!options.force && game.coverUrl) { report.alreadyComplete++; continue; }
    try {
      const candidates = await provider.searchGame({title: game.title, platform: 'Mega Drive / Genesis', year: game.releaseYear ?? undefined});
      if (!candidates.length) { report.notFound++; continue; }
      const matches = [];
      for (const candidate of candidates.slice(0, 5)) matches.push(scoreMetadataMatch(game, await provider.getGameDetails(candidate.externalId)));
      matches.sort((a, b) => b.confidence - a.confidence);
      const best = matches[0];
      const tooClose = matches[1] && best.confidence - matches[1].confidence < 0.08;
      if (best.confidence < 0.72 || tooClose) { report.ambiguous++; report.ambiguousMatches.push({game: game.title, candidate: best.candidate.title, confidence: best.confidence, reasons: best.reasons}); continue; }
      if (!options.dryRun) {
        const data = best.candidate;
        if (!game.coverUrl && data.coverUrl) game.coverUrl = data.coverUrl;
        Object.assign(game, {metadataSource: data.source, metadataExternalId: data.externalId, metadataUpdatedAt: new Date().toISOString(), coverSource: data.coverUrl ? data.source : undefined, coverAttribution: data.attribution});
      }
      report.updated++;
    } catch (error) { report.failed++; report.errors.push({game: game.title, error: error instanceof Error ? error.message : String(error)}); }
  }
  for (const game of games) { if (!game.coverUrl) report.missingCovers.push(game.title); }
  fs.mkdirSync('data/reports', {recursive: true});
  fs.writeFileSync('data/reports/metadata-report.json', `${JSON.stringify(report, null, 2)}\n`);
  if (!options.dryRun) fs.writeFileSync(file, `${JSON.stringify(games, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  return report;
}

if (process.argv[1]?.endsWith('enrich-igdb.ts')) enrich().catch(error => { console.error(error); process.exitCode = 1; });
