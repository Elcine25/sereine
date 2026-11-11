import { Image, StyleSheet } from 'react-native';

// Illustration des articles (liste des Ressources, carrousel de l'accueil).
// Pour le moment, la même image pour tous ; elle sert aussi d'en-tête dans
// l'article (src/app/fiche/[id].tsx).
export const IMAGE_ARTICLE = require('../../assets/images/article.jpg');

export function Vignette({ size = 84 }: { size?: number }) {
  return (
    <Image
      source={IMAGE_ARTICLE}
      style={[styles.image, { width: size, height: size, borderRadius: Math.round(size * 0.21) }]}
      resizeMode="cover"
      accessible={false}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  // Fond de l'image (bleu nuit), visible pendant le chargement.
  image: { backgroundColor: '#0B0A1F' },
});
