'use client';
/* eslint-disable @next/next/no-img-element */

import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {CatalogueGame, searchGames} from '@/lib/games';
import {mediaUrl} from '@/lib/media';

type Props = {
  games: CatalogueGame[];
  name?: string;
  initialSlug?: string;
  label?: string;
  placeholder?: string;
  onQueryChange?: (query: string) => void;
  onSelect?: (game: CatalogueGame) => void;
  required?: boolean;
};

export function GameAutocomplete({games, name = 'gameId', initialSlug, label = 'Jeu', placeholder = 'Saisissez les premières lettres…', onQueryChange, onSelect, required}: Props) {
  const initial = games.find(game => game.slug === initialSlug);
  const [query, setQuery] = useState(initial?.title ?? '');
  const [selectedId, setSelectedId] = useState(initial?.slug ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = `${inputId}-listbox`;
  const results = useMemo(() => searchGames(games, query, 10), [games, query]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  function choose(game: CatalogueGame) {
    setQuery(game.title);
    setSelectedId(game.slug);
    setOpen(false);
    setActive(-1);
    onQueryChange?.(game.title);
    onSelect?.(game);
  }

  return <div className="game-combobox" ref={root}>
    <label htmlFor={inputId}>{label}</label>
    <input type="hidden" name={name} value={selectedId}/>
    <input
      id={inputId}
      value={query}
      placeholder={placeholder}
      autoComplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      required={required}
      onFocus={() => setOpen(true)}
      onChange={event => {
        const value = event.target.value;
        setQuery(value);
        setSelectedId('');
        setOpen(true);
        setActive(-1);
        onQueryChange?.(value);
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(value => Math.min(value + 1, results.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => Math.max(value - 1, 0)); }
        if (event.key === 'Enter' && open && active >= 0) { event.preventDefault(); choose(results[active]); }
        if (event.key === 'Escape') { setOpen(false); setActive(-1); }
      }}
    />
    {open && query && <ul id={listId} className="game-suggestions" role="listbox">
      {results.map((game, index) => <li
        id={`${listId}-${index}`}
        key={game.slug}
        role="option"
        aria-selected={index === active}
        className={index === active ? 'active' : undefined}
        onPointerDown={event => { event.preventDefault(); choose(game); }}
      >
        <span className="suggestion-cover" aria-hidden="true">{game.coverUrl ? <img src={mediaUrl(game.coverUrl)} alt="" width="36" height="48" loading="lazy" decoding="async"/> : 'RC'}</span>
        <span><strong>{game.title}</strong><small>{game.releaseYear ?? 'Année inconnue'} · {game.playerMax ? `jusqu’à ${game.playerMax} joueurs` : 'Joueurs inconnus'}</small></span>
      </li>)}
      {!results.length && <li className="no-result">Aucun jeu trouvé</li>}
    </ul>}
  </div>;
}
