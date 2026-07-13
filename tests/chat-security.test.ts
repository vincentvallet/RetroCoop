import {describe,expect,it} from 'vitest';import {ChatError,validateChatContent} from '../lib/chat';
function code(value:string){try{validateChatContent(value);return null}catch(error){return(error as ChatError).code}}
describe('validation du chat',()=>{
  it('accepte du texte brut normal et détecte un raccourcisseur',()=>{expect(validateChatContent('Rendez-vous à 20 h !').content).toBe('Rendez-vous à 20 h !');expect(validateChatContent('Voir https://bit.ly/test').suspicious).toBe(true)});
  it('refuse vide, longueur, HTML et répétitions',()=>{expect(code('   ')).toBe('EMPTY_MESSAGE');expect(code('x'.repeat(501))).toBe('MESSAGE_TOO_LONG');expect(code('<script>alert(1)</script>')).toBe('PLAIN_TEXT_ONLY');expect(code('a'.repeat(30))).toBe('REPETITIVE_CONTENT')});
  it('refuse plus de deux liens',()=>expect(code('https://a.test https://b.test https://c.test')).toBe('TOO_MANY_LINKS'));
});
