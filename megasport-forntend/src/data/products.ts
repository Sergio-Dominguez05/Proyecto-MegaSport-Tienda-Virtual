import type { Product } from '../types/catalog'

{/* Esta pagina fue hecha en su totalidad con IA contiene productos de prueba que le pedi a la IA que me diera para llenar 
    temporalmente el catalogo en la creacion del FrontEnd antes de hacer la implementacion del backEnd para obtener los productos
    de verdad de la base de datos, posteriormente no sera utilizada, esto solo es para el proceso de pruebas*/}

export const products: Product[] = [
  {
    id: 1,
    nombre: 'Camiseta Running Pro',
    descripcion: 'Camiseta deportiva ligera para entrenamiento y running.',
    precio: 249.99,
    urlImg:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    activo: true,
    creadoEn: '2026-09-18',
    categoria: 'hombre',

    variantes: [
      {
        idVariante: 1,
        talla: 'S',
        color: 'Negro',
        sku: 'CAM-RUN-S-NEG',
        stock: 8,
        stockMinimo: 2,
        activo: true,
      },
      {
        idVariante: 2,
        talla: 'M',
        color: 'Negro',
        sku: 'CAM-RUN-M-NEG',
        stock: 5,
        stockMinimo: 2,
        activo: true,
      },
      {
        idVariante: 3,
        talla: 'L',
        color: 'Azul',
        sku: 'CAM-RUN-L-AZU',
        stock: 0,
        stockMinimo: 2,
        activo: true,
      },
    ],
  },

  {
    id: 2,
    nombre: 'Sudadera Training',
    descripcion: 'Sudadera deportiva cómoda para entrenamiento y uso diario.',
    precio: 349.99,
    urlImg:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
    activo: true,
    creadoEn: '2026-09-18',
    categoria: 'hombre',

    variantes: [
      {
        idVariante: 4,
        talla: 'M',
        color: 'Gris',
        sku: 'SUD-TRA-M-GRI',
        stock: 4,
        stockMinimo: 2,
        activo: true,
      },
      {
        idVariante: 5,
        talla: 'L',
        color: 'Gris',
        sku: 'SUD-TRA-L-GRI',
        stock: 2,
        stockMinimo: 2,
        activo: true,
      },
    ],
  },

  {
    id: 3,
    nombre: 'Leggings Performance',
    descripcion: 'Leggings deportivos flexibles para entrenamiento.',
    precio: 299.99,
    urlImg:
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80',
    activo: true,
    creadoEn: '2026-09-18',
    categoria: 'mujer',

    variantes: [
      {
        idVariante: 6,
        talla: 'S',
        color: 'Negro',
        sku: 'LEG-PER-S-NEG',
        stock: 7,
        stockMinimo: 2,
        activo: true,
      },
      {
        idVariante: 7,
        talla: 'M',
        color: 'Negro',
        sku: 'LEG-PER-M-NEG',
        stock: 6,
        stockMinimo: 2,
        activo: true,
      },
    ],
  },

  {
    id: 4,
    nombre: 'Tenis Performance X1',
    descripcion: 'Calzado deportivo para entrenamiento y uso diario.',
    precio: 599.99,
    urlImg:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    activo: true,
    creadoEn: '2026-09-18',
    categoria: 'zapatos',

    variantes: [
      {
        idVariante: 8,
        talla: '40',
        color: 'Rojo',
        sku: 'TEN-X1-40-ROJ',
        stock: 5,
        stockMinimo: 1,
        activo: true,
      },
      {
        idVariante: 9,
        talla: '41',
        color: 'Rojo',
        sku: 'TEN-X1-41-ROJ',
        stock: 3,
        stockMinimo: 1,
        activo: true,
      },
      {
        idVariante: 10,
        talla: '42',
        color: 'Rojo',
        sku: 'TEN-X1-42-ROJ',
        stock: 0,
        stockMinimo: 1,
        activo: true,
      },
    ],
  },

  {
    id: 5,
    nombre: 'Camiseta Junior Sport',
    descripcion: 'Camiseta deportiva cómoda para niños y niñas.',
    precio: 179.99,
    urlImg:
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=700&q=80',
    activo: true,
    creadoEn: '2026-09-18',
    categoria: 'ninos',

    variantes: [
      {
        idVariante: 11,
        talla: '8',
        color: 'Azul',
        sku: 'CAM-JUN-8-AZU',
        stock: 6,
        stockMinimo: 2,
        activo: true,
      },
      {
        idVariante: 12,
        talla: '10',
        color: 'Azul',
        sku: 'CAM-JUN-10-AZU',
        stock: 4,
        stockMinimo: 2,
        activo: true,
      },
    ],
  },
]