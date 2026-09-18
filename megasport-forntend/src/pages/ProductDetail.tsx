import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { products } from '../data/products'

{/*La version de prueba de esta pagina fue hecha en su totalidad con IA para fines de simulacion ya que todavia no cree el carrito
    La implementacion funcional con el BackEnd y Posteriormente la base de datos y con el carrito creado se va a hacer despues
    y descartara muchos de los cambios actuales de la IA pero el diseño general se conservara*/}


function ProductDetail() {

  const { id } = useParams()

  const product = products.find(
    (product) =>
      product.id === Number(id) &&
      product.activo
  )


  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)


  // Si el producto no existe
  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20">

        <div className="rounded-2xl border border-gray-200 p-12 text-center">

          <h1 className="text-3xl font-bold text-slate-900">
            Producto no encontrado
          </h1>

          <p className="mt-3 text-gray-500">
            El producto que buscas no existe o ya no está disponible.
          </p>

          <Link
            to="/"
            className="mt-8 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            Volver al inicio
          </Link>

        </div>

      </main>
    )
  }


  // Colores únicos de las variantes activas
  const colors = [
    ...new Set(
      product.variantes
        .filter((variant) => variant.activo)
        .map((variant) => variant.color)
    ),
  ]


  // Tallas correspondientes al color seleccionado
  const sizes = product.variantes
    .filter(
      (variant) =>
        variant.activo &&
        variant.color === selectedColor
    )
    .map((variant) => ({
      size: variant.talla,
      stock: variant.stock,
    }))


  // Variante exacta escogida por el usuario
  const selectedVariant = product.variantes.find(
    (variant) =>
      variant.activo &&
      variant.color === selectedColor &&
      variant.talla === selectedSize
  )


  const handleColorSelection = (color: string) => {
    setSelectedColor(color)

    // Al cambiar de color, obligamos a escoger talla nuevamente
    setSelectedSize('')
    setQuantity(1)
  }


  const handleSizeSelection = (size: string) => {
    setSelectedSize(size)
    setQuantity(1)
  }


  const increaseQuantity = () => {

    if (!selectedVariant) {
      return
    }

    if (quantity < selectedVariant.stock) {
      setQuantity(quantity + 1)
    }
  }


  const decreaseQuantity = () => {

    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }


  const handleAddToCart = () => {

    if (!selectedVariant) {
      return
    }

    console.log({
      producto: product.id,
      variante: selectedVariant.idVariante,
      cantidad: quantity,
    })

    alert(
      `${product.nombre} - ${selectedVariant.color} / ${selectedVariant.talla} seleccionado`
    )
  }


  return (
    <main>

      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* BREADCRUMB */}
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-500">

          <Link
            to="/"
            className="transition hover:text-slate-900"
          >
            Inicio
          </Link>

          <span>/</span>

          <Link
            to={`/categoria/${product.categoria}`}
            className="capitalize transition hover:text-slate-900"
          >
            {product.categoria === 'ninos'
              ? 'Niños'
              : product.categoria}
          </Link>

          <span>/</span>

          <span className="text-slate-900">
            {product.nombre}
          </span>

        </div>


        <div className="grid gap-12 lg:grid-cols-2">

          {/* IMAGEN */}
          <div>

            <div className="overflow-hidden rounded-3xl bg-gray-100">

              <img
                src={product.urlImg}
                alt={product.nombre}
                className="aspect-square h-full w-full object-cover"
              />

            </div>

          </div>


          {/* INFORMACIÓN */}
          <div className="flex flex-col justify-center">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              MegaSport
            </p>


            <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl">
              {product.nombre}
            </h1>


            <p className="mt-5 text-3xl font-bold text-slate-900">
              Q{product.precio.toFixed(2)}
            </p>


            <p className="mt-6 max-w-xl leading-7 text-gray-600">
              {product.descripcion}
            </p>


            {/* COLOR */}
            <div className="mt-10">

              <div className="flex items-center justify-between">

                <h2 className="font-semibold text-slate-900">
                  Color
                </h2>

                {selectedColor && (
                  <span className="text-sm text-gray-500">
                    {selectedColor}
                  </span>
                )}

              </div>


              <div className="mt-3 flex flex-wrap gap-3">

                {colors.map((color) => (

                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelection(color)}
                    className={
                      selectedColor === color
                        ? 'rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white'
                        : 'rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900'
                    }
                  >
                    {color}
                  </button>

                ))}

              </div>

            </div>


            {/* TALLA */}
            <div className="mt-8">

              <h2 className="font-semibold text-slate-900">
                Talla
              </h2>


              {!selectedColor ? (

                <p className="mt-3 text-sm text-gray-500">
                  Selecciona primero un color.
                </p>

              ) : (

                <div className="mt-3 flex flex-wrap gap-3">

                  {sizes.map(({ size, stock }) => (

                    <button
                      key={size}
                      type="button"
                      disabled={stock === 0}
                      onClick={() => handleSizeSelection(size)}
                      className={
                        stock === 0
                          ? 'cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-400 line-through'
                          : selectedSize === size
                            ? 'rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white'
                            : 'rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900'
                      }
                    >
                      {size}
                    </button>

                  ))}

                </div>

              )}

            </div>


            {/* INFORMACIÓN DE VARIANTE */}
            {selectedVariant && (

              <div className="mt-8 rounded-2xl bg-gray-50 p-5">

                <div className="flex flex-wrap justify-between gap-4">

                  <div>

                    <p className="text-sm text-gray-500">
                      SKU
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedVariant.sku}
                    </p>

                  </div>


                  <div>

                    <p className="text-sm text-gray-500">
                      Disponibilidad
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedVariant.stock} unidades
                    </p>

                  </div>

                </div>

              </div>

            )}


            {/* CANTIDAD */}
            <div className="mt-8">

              <h2 className="font-semibold text-slate-900">
                Cantidad
              </h2>


              <div className="mt-3 flex items-center">

                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={!selectedVariant}
                  className="flex h-11 w-11 items-center justify-center rounded-l-xl border border-gray-300 text-xl font-semibold disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  −
                </button>


                <div className="flex h-11 w-16 items-center justify-center border-y border-gray-300 font-semibold">
                  {quantity}
                </div>


                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={!selectedVariant}
                  className="flex h-11 w-11 items-center justify-center rounded-r-xl border border-gray-300 text-xl font-semibold disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  +
                </button>

              </div>

            </div>


            {/* AGREGAR AL CARRITO */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
              className="mt-10 w-full rounded-xl bg-slate-950 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {selectedVariant
                ? 'Agregar al carrito'
                : 'Selecciona color y talla'}
            </button>

          </div>

        </div>

      </section>

    </main>
  )
}

export default ProductDetail