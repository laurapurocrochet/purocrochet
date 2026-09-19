// Mapping of the store's original hardcoded products (lib/products.js) to the
// section they belong in and the local image files that go with them. Used to
// migrate the existing catalog into Supabase (see api/admin/seed.js).
export const SEED_SECTION_MAP = {
  'ruana-abrazo': 'inicio', 'cardigan-abrazo': 'inicio', 'chaleco-abrazo': 'inicio',
  'bufanda-capucha-abrazo': 'inicio', 'poncho-abrazo': 'inicio', 'chaleco-suave': 'inicio',
  'cardigan-calido': 'inicio', 'poncho-luz': 'inicio',
  'guia-ruana-abrazo': 'guias', 'guia-cardigan-abrazo': 'guias', 'guia-chaleco-abrazo': 'guias',
  'guia-bufanda-capucha': 'guias', 'guia-poncho-abrazo': 'guias', 'guia-poncho-luz': 'guias',
  'guia-chaleco-suave': 'guias', 'guia-cardigan-calido': 'guias', 'guia-medias': 'guias',
  'pareo-alma': 'guias', 'bolso-fiume': 'guias',
  'gratis-pareo': 'gratis', 'gratis-cuellito': 'gratis'
};

export const SEED_IMAGE_MAP = {
  'ruana-abrazo': ['ruana-abrazo-portada.jpg', 'ruana-abrazo-detalle.jpg'],
  'cardigan-abrazo': ['cardigan-abrazo-portada.jpg', 'cardigan-abrazo-detalle.jpg'],
  'chaleco-abrazo': ['chaleco-abrazo-portada.jpg', 'chaleco-abrazo-detalle.jpg'],
  'bufanda-capucha-abrazo': ['bufanda-capucha-abrazo-portada.jpg', 'bufanda-capucha-abrazo.jpg'],
  'poncho-abrazo': ['poncho-abrazo-portada.jpg', 'poncho-abrazo-detalle.jgp'],
  'chaleco-suave': ['chaleco-suave-portada.jpg', 'chaleco-suave-detalle.jpg'],
  'cardigan-calido': ['cardigan-calido-portada.jpg', 'cardigan-calido-detalle.jpg'],
  'poncho-luz': ['poncho-luz-portada.jpg', 'poncho-luz-detalle.jgp.jpeg'],
  'guia-ruana-abrazo': ['ruana-abrazo-portada.jpg', 'ruana-abrazo-detalle.jpg'],
  'guia-cardigan-abrazo': ['cardigan-abrazo-portada.jpg', 'cardigan-abrazo-detalle.jpg'],
  'guia-chaleco-abrazo': ['chaleco-abrazo-portada.jpg', 'chaleco-abrazo-detalle.jpg'],
  'guia-bufanda-capucha': ['bufanda-capucha-abrazo-portada.jpg', 'bufanda-capucha-abrazo.jpg'],
  'guia-poncho-abrazo': ['poncho-abrazo-portada.jpg', 'poncho-abrazo-detalle.jgp'],
  'guia-poncho-luz': ['poncho-luz-portada.jpg', 'poncho-luz-detalle.jgp.jpeg'],
  'guia-chaleco-suave': ['chaleco-suave-portada.jpg', 'chaleco-suave-detalle.jpg'],
  'guia-cardigan-calido': ['cardigan-calido-portada.jpg', 'cardigan-calido-detalle.jpg'],
  'guia-medias': ['medias-portada.jpg', 'medias-detalle.jpg'],
  'pareo-alma': ['pareo-alma-portada.jpg', 'pareo-alma-detalle.jpg'],
  'bolso-fiume': ['bolso-fiume-portada.jpg', 'bolso-fiume-detalle.jpg'],
  'gratis-pareo': ['pareo-alma-portada.jpg', 'pareo-alma-detalle.jpg'],
  'gratis-cuellito': ['bufanda-capucha-abrazo-portada.jpg', 'bufanda-capucha-abrazo.jpg']
};
