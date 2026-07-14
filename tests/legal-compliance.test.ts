import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {independenceNotice, legalConfig, legalContactPublicAllowlist} from '../lib/legal-config';
import {publicUsername} from '../lib/public-user';

describe('configuration juridique OFID', () => {
  it('centralise les identifiants institutionnels exacts', () => {
    expect(legalConfig.publisherName).toBe('OFID');
    expect(legalConfig.siret).toBe('939 818 126 00012');
    expect(legalConfig.activityDeclarationNumber).toBe('32591338859');
    expect(legalConfig.vatNumber).toBe('FR10939818126');
    expect(legalConfig.publicationDirector).toBe('Vincent Vallet');
    expect(legalConfig.contactEmail).toBe('contact@ofid.fr');
    expect(legalConfig.publicPostalAddress).toBeNull();
    expect(legalContactPublicAllowlist).toContain('/mentions-legales');
    expect(legalContactPublicAllowlist).not.toContain('/signalement-droits');
  });

  it('interdit définitivement l’ancien contact dans le dépôt', () => {
    const forbidden = ['contact', 'retrocoop.fr'].join('@');
    let matches = '';
    try {
      matches = execFileSync('rg', ['-l', '--fixed-strings', forbidden, '.', '--glob', '!node_modules/**', '--glob', '!.git/**', '--glob', '!.next/**', '--glob', '!test-results/**'], {encoding: 'utf8'});
    } catch (error) {
      const status = (error as {status?: number}).status;
      if (status !== 1) throw error;
    }
    expect(matches.trim()).toBe('');
  });

  it('utilise le footer et les routes institutionnelles autorisées', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8');
    expect(independenceNotice).toBe('Les marques, titres et visuels appartiennent à leurs ayants droit respectifs. RetroCoop est un projet expérimental gratuit indépendant et sans affiliation.');
    expect(layout).toContain('/mentions-legales');
    expect(layout).toContain('/respect-droits-auteur');
    expect(layout).not.toContain('/signalement-droits');
  });

  it('ne dérive jamais une identité publique de l’email', () => {
    const alias = publicUsername('legacy@example.test', 'stable-user-id');
    expect(alias).toMatch(/^Joueur-[A-F0-9]{8}$/);
    expect(alias).not.toMatch(/@|example|legacy/i);
  });

  it('n’expose aucun champ email utilisateur dans les sérialiseurs publics', () => {
    const sources = ['lib/sessions.ts', 'lib/chat.ts', 'lib/notifications.ts', 'app/api/auth/me/route.ts'].map(path => readFileSync(path, 'utf8')).join('\n');
    const forbiddenFields = new RegExp(['emailMasked', 'organizerEmail', 'hostEmail', 'participantEmail', 'authorEmail'].join('|'), 'i');
    expect(sources).not.toMatch(forbiddenFields);
  });
});
