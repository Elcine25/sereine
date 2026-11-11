import { Analytics } from '@vercel/analytics/react';
import { usePathname, useSegments } from 'expo-router';

// Vercel Web Analytics : compte les visites et les pages vues de la version web,
// sans cookies ni données personnelles. Les chiffres sont dans le dashboard Vercel
// (onglet Analytics). Ne fonctionne qu'une fois le site publié sur Vercel.
//
// L'app n'a qu'une page HTML : on signale chaque changement d'écran à Vercel.
// `route` regroupe les pages du même type (ex. /fiche/[id] pour tous les articles).
export function Statistiques() {
  const path = usePathname();
  const segments = useSegments() as string[];
  const route = '/' + segments.filter((s) => !s.startsWith('(')).join('/');
  return <Analytics route={route} path={path} />;
}
