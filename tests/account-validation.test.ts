import {describe,expect,it} from 'vitest';
import {validatePassword,validateUsername} from '../lib/account-validation';
import {publicUsername} from '../lib/public-user';

describe('validation du compte',()=>{
  it.each(['Alice','Alice 42','Jean-Luc','joueur_test','Élodie 7'])('accepte le pseudo %s',username=>expect(validateUsername(username).ok).toBe(true));
  it.each(['ab','a'.repeat(25),'alice@example.com','<b>Alice</b>',' Alice','Alice  Deux','admin','SYSTÈME','RetroCoop Team'])('refuse le pseudo %s',username=>expect(validateUsername(username).ok).toBe(false));
  it('normalise la casse pour la contrainte unique',()=>{const first=validateUsername('Vincent'),second=validateUsername('VINCENT');expect(first.ok&&second.ok&&first.normalized).toBe(second.ok?second.normalized:'')});
  it('applique une politique de mot de passe mémorisable',()=>{expect(validatePassword('phrase longue 2026').ok).toBe(true);expect(validatePassword('court1').ok).toBe(false);expect(validatePassword('uniquementdeslettres').ok).toBe(false)});
  it('ne dérive jamais un alias public de l’email',()=>{const alias=publicUsername('alice@example.com','cm123');expect(alias).toMatch(/^Joueur-/);expect(alias).not.toContain('alice')});
});
