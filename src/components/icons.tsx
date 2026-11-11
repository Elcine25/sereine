import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/lib/theme';

export type IconName =
  | 'accueil'
  | 'humeur'
  | 'respirer'
  | 'ressources'
  | 'sos'
  | 'retour'
  | 'suivant'
  | 'reglages'
  | 'cadenas'
  | 'empreinte'
  | 'effacer'
  | 'valider'
  | 'telephone'
  | 'journal'
  | 'sena'
  | 'favori'
  | 'partager'
  | 'envoyer'
  | 'lecture'
  | 'pause';

// Icônes au trait, dessinées sur une grille de 24 px.
function formes(name: IconName) {
  switch (name) {
    case 'accueil':
      return <Path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />;
    case 'humeur':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 10h.01M15 10h.01" />
        </>
      );
    case 'respirer':
      return <Path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7" />;
    case 'ressources':
      return <Path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7" />;
    case 'sos':
    case 'telephone':
      return (
        <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
      );
    case 'retour':
      return <Path d="M15 5l-7 7 7 7" />;
    case 'suivant':
      return <Path d="M5 12h14M13 6l6 6-6 6" />;
    case 'reglages':
      return (
        <>
          <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
          <Circle cx="15" cy="7" r="2" />
          <Circle cx="9" cy="17" r="2" />
        </>
      );
    case 'cadenas':
      return (
        <>
          <Rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </>
      );
    case 'empreinte':
      return (
        <Path d="M7 4.5A9 9 0 0 1 20.5 12M3.5 9A9 9 0 0 0 3 12c0 3 .8 5.5 2 7.5M8.5 20.5c-1-1.8-1.5-4-1.5-6.5a5 5 0 0 1 10 0c0 1.5-.1 3-.4 4.3M12 13.5c0 3 .6 5.6 1.8 7.5M16.5 21c.4-.7.7-1.5 1-2.3" />
      );
    case 'effacer':
      return <Path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7zM12.5 9.5l5 5M17.5 9.5l-5 5" />;
    case 'valider':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" />;
    case 'journal':
      return <Path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2zM6 18a2 2 0 0 1 2-2h10" />;
    case 'sena':
      return <Path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12z" />;
    case 'favori':
      return <Path d="M6 4h12v16l-6-4-6 4z" />;
    case 'partager':
      return <Path d="M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />;
    case 'envoyer':
      return <Path d="M5 12h14M13 6l6 6-6 6" />;
    case 'lecture':
      return <Path d="M7 4.5v15l12-7.5z" />;
    case 'pause':
      return <Path d="M8 5v14M16 5v14" />;
  }
}

export function Icon({
  name,
  size = 24,
  color = colors.text,
  strokeWidth = 1.9,
  rempli = false,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
  rempli?: boolean; // remplit la forme (favori enregistré, lecture…)
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={rempli ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {formes(name)}
    </Svg>
  );
}
