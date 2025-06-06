export default function customImageLoader({ src, width, quality }) {
  // Para imagens locais
  if (src.startsWith('/')) {
    return `/_next${src}`;
  }
  
  // Para imagens externas
  return src;
} 