export const PRODUCTS = {
  'guia-ruana-abrazo': { id: 'guia-ruana-abrazo', title: 'Patrón Ruana Abrazo', price: 20000, file: 'Patron Ruana Abrazo - copia.pdf' },
  'guia-cardigan-abrazo': { id: 'guia-cardigan-abrazo', title: 'Patrón Cárdigan Abrazo', price: 25000, file: 'Patron cardigan abrazo.pdf' },
  'guia-chaleco-abrazo': { id: 'guia-chaleco-abrazo', title: 'Patrón Chaleco Abrazo', price: 15000, file: 'Chaleco Abrazo.pdf' },
  'guia-bufanda-capucha': { id: 'guia-bufanda-capucha', title: 'Patrón Bufanda con Capucha Abrazo', price: 12000, file: 'Bufanda con capucha Abrazo.pdf' },
  'guia-poncho-abrazo': { id: 'guia-poncho-abrazo', title: 'Patrón Poncho Abrazo', price: 20000, file: 'Poncho Abrazo.pdf' },
  'guia-poncho-luz': { id: 'guia-poncho-luz', title: 'Patrón Poncho Luz', price: 20000, file: 'Poncho Abrazo.pdf' },
  'poncho-luz': { id: 'poncho-luz', title: 'Patrón Poncho Luz', price: 20000, file: 'Poncho Abrazo.pdf' },
  'guia-chaleco-suave': { id: 'guia-chaleco-suave', title: 'Patrón Chaleco Abrazo Suave', price: 15000, file: 'Patron Chaleco Abrazo Suave.pdf' },
  'guia-cardigan-calido': { id: 'guia-cardigan-calido', title: 'Patrón Cárdigan Abrazo Cálido', price: 20000, file: 'Patron Cardigan Abrazo Calido.pdf' },
  'guia-medias': { id: 'guia-medias', title: 'Patrón Medias Abrazo', price: 8000, file: 'Patron medias Abrazo.pdf' },
  'pareo-alma': { id: 'pareo-alma', title: 'Patrón Pareo Alma', price: 18000, file: 'Pareo Alma fotos.pdf' },
  'bolso-fiume': { id: 'bolso-fiume', title: 'Patrón Bolso Fiume', price: 12000, file: 'Bolso Fiume.pdf' },
  'ruana-abrazo': { id: 'ruana-abrazo', title: 'Patrón Ruana Abrazo', price: 20000, file: 'Patron Ruana Abrazo - copia.pdf' },
  'cardigan-abrazo': { id: 'cardigan-abrazo', title: 'Patrón Cárdigan Abrazo', price: 25000, file: 'Patron cardigan abrazo.pdf' },
  'chaleco-abrazo': { id: 'chaleco-abrazo', title: 'Patrón Chaleco Abrazo', price: 15000, file: 'Chaleco Abrazo.pdf' },
  'bufanda-capucha-abrazo': { id: 'bufanda-capucha-abrazo', title: 'Patrón Bufanda con Capucha Abrazo', price: 12000, file: 'Bufanda con capucha Abrazo.pdf' },
  'poncho-abrazo': { id: 'poncho-abrazo', title: 'Patrón Poncho Abrazo', price: 20000, file: 'Poncho Abrazo.pdf' },
  'chaleco-suave': { id: 'chaleco-suave', title: 'Patrón Chaleco Abrazo Suave', price: 15000, file: 'Patron Chaleco Abrazo Suave.pdf' },
  'cardigan-calido': { id: 'cardigan-calido', title: 'Patrón Cárdigan Abrazo Cálido', price: 20000, file: 'Patron Cardigan Abrazo Calido.pdf' },
  'gratis-pareo': { id: 'gratis-pareo', title: 'Patrón Pareo (Gratis)', price: 0, file: 'Pareo Alma fotos.pdf' },
  'gratis-cuellito': { id: 'gratis-cuellito', title: 'Patrón Cuellito (Gratis)', price: 0, file: 'Bufanda con capucha Abrazo.pdf' }
};

export function productFor(id) {
  return PRODUCTS[id] || null;
}
