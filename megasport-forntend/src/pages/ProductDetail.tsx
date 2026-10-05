import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useEffect } from 'react'
import { getProductById } from '../services/catalogApi'
import type { Product } from '../types/catalog'

{/*La version de prueba de esta pagina fue hecha en su totalidad con IA para fines de simulacion ya que todavia no cree el carrito
    La implementacion funcional con el BackEnd y Posteriormente la base de datos y con el carrito creado se va a hacer despues
    y descartara muchos de los cambios actuales de la IA pero el diseño general se conservara*/}
  
{/*Nota de despues de 2 semanas: ya se hicieron los cambios para implementar el de forma real el backend y ya se descartaron
  los cambios hechos por la IA*/}


function ProductDetail() {

  const { id } = useParams()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    async function loadProduct() {

      const productId = Number(id)
      if (!Number.isInteger(productId) || productId <= 0) {
        setError('Producto inválido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getProductById(productId)
        setProduct(data)
        setError(null)

      } catch (error) {

        console.error(error)
        setError('No se pudo cargar el producto')

      } finally {

        setLoading(false)
      }
    }


    loadProduct()

  }, [id])

  const { addItem } = useCart()


  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)


  if (loading) {

    return (
      <main>
        Cargando producto...
      </main>
    )
  }


  if (error) {

    return (
      <main>
        {error}
      </main>
    )
  }


  if (!product) {

    return (
      <main>
        Producto no encontrado
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


  const handleAddToCart = async () => {

    if (!selectedVariant || adding) {
      return
    }

    setAdding(true)
    setCartError(null)
    try {
      await addItem(selectedVariant.idVariante, quantity, selectedVariant.stock)
      // Solo retroceder si existe una entrada anterior dentro del router.
      if (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0) {
        navigate(-1)
      } else {
        navigate(`/categoria/${product.categoria}`, { replace: true })
      }
    } catch (requestError) {
      setCartError(requestError instanceof Error ? requestError.message : 'No se pudo agregar el producto')
    } finally {
      setAdding(false)
    }
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
                src={product.urlImg ?? '/product-placeholder.svg'}
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
              disabled={adding || !selectedVariant || selectedVariant.stock === 0}
              className="mt-10 w-full rounded-xl bg-slate-950 px-6 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {adding ? 'Agregando...' : selectedVariant
                ? 'Agregar al carrito'
                : 'Selecciona color y talla'}
            </button>

            {cartError && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {cartError}
              </p>
            )}

          </div>

        </div>

      </section>

    </main>
  )
}

export default ProductDetail
