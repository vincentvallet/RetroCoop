import type {MetadataRoute} from 'next';
import games from '@/data/normalized/megadrive-games.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || 'http://localhost:3000';
  const pages = [
    '', '/catalogue', '/sessions', '/classement', '/sources-et-droits', '/cgu',
    '/confidentialite', '/mentions-legales', '/respect-droits-auteur', '/contact',
    ...games.map(game => `/jeux/megadrive/${game.slug}`),
  ];
  return pages.map(url => ({url: base + url, lastModified: new Date()}));
}
