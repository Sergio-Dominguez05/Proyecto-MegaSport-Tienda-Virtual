import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { products } from "../data/products"
import { useNavigate } from "react-router-dom"
import { useOrder } from "../context/OrderContext"

function Cart (){

    const navigate = useNavigate()

    const {startOrder} = useOrder()
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart
    } = useCart()

    const detailedItems = items.flatMap((item) => {
        const product = products.find((product) => product.variantes.some((variant) => variant.idVariante === item.idVariante))

        if (!product) {
            return []
        }

        const variant= product.variantes.find((variant) => variant.idVariante === item.idVariante)

        if(!variant){
            return[]
        }

        return [
            {
                item,
                product,
                variant
            }
        ]
    })

    const subtotal = detailedItems.reduce( (total, {item, product}) => {
        return (
            total + product.precio * item.cantidad
        )
    }, 0)

    const handleContinuePurchase = () => {
        if (detailedItems.length === 0){
            return
        }

        const detalles = detailedItems.map(({
            item,
            product,
            variant
        }) => ({
            idVariante: variant.idVariante,
            cantidad: item.cantidad,
            precioPorUnidad: product.precio
        }))

        startOrder({ subtotalAntesDelEnvio: subtotal, detalles})
        navigate('/checkout')
    }

    if (items.length === 0){
        return(
            <main className="mx-auto max-w-7xl px-6 py-16">

                <h1 className="text-4xl font-bold text-slate-900">
                    Tu carrito
                </h1>


                <div className="mt-10 rounded-2xl border border-gray-200 p-14 text-center">

                    <h2 className="text-2xl font-semibold text-slate-900">
                        El carrito está vacío
                    </h2>

                    <Link
                        to="/"
                        className="mt-8 inline-block rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white transition hover:bg-slate-700"
                    >
                        Empieza tu compra :D
                    </Link>

                </div>

            </main>
        )
    }

    return(
    <main className="mx-auto max-w-7xl px-6 py-16">

        <div className="flex flex-wrap items-end justify-between gap-4">

            <div>

                <h1 className="text-4xl font-bold text-slate-900">
                    Tu carrito
                </h1>

            </div>


            <button
            type="button"
            onClick={clearCart}
            className="text-sm font-semibold text-red-600 transition hover:text-red-800"
            >
            Vaciar carrito
            </button>

        </div>


        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
                {detailedItems.map(
                    ({
                        item,
                        product,
                        variant
                    }) => (
                        <article
                            key={variant.idVariante}
                            className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row">
                                
                                <Link
                                    to={`/producto/${product.id}`}
                                    className="shrink-0">

                                        <img
                                            src={product.urlImg}
                                            alt={product.nombre}
                                            className="h-40 w-full rounded-xl object-cover sm:w-40" />
                                </Link>

                                <div className="flex flex-1 flex-col">
                                        <div className="flex flex-wrap justify-between gap-4">
                                            <div>
                                                <p className="text-sm capitalize text-gray-500">
                                                    {product.categoria}
                                                </p>

                                                <Link
                                                    to={`/product/${product.id}`}>
                                                        <h2 className="mt-1 text-xl font-semibold text-slate-900 hover:text-gray-600">
                                                            {product.nombre}
                                                        </h2>
                                                    </Link>

                                                <p className="mt-2 text-sm text-gray-500">
                                                    Color: {variant.color}
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Talla: {variant.talla}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    SKU: {variant.sku}
                                                </p>
                                            </div>

                                            <p className="text-xl font-bold text-slate-900">
                                                Q{product.precio.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="mt-auto flex flex-wrap items-end justify-between gap-5 pt-6">

                                            <div>

                                            <p className="mb-2 text-sm text-gray-500">
                                                Cantidad
                                            </p>


                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            variant.idVariante,
                                                            item.cantidad - 1,
                                                            variant.stock
                                                        )
                                                    }
                                                className="flex h-10 w-10 items-center justify-center rounded-l-lg border border-gray-300 text-lg"
                                                >
                                                    -
                                                </button>


                                                <div className="flex h-10 w-14 items-center justify-center border-y border-gray-300 font-semibold">
                                                    {item.cantidad}
                                                </div>


                                                <button
                                                    type="button"
                                                    disabled={
                                                        item.cantidad >= variant.stock
                                                    }
                                                    onClick={() =>
                                                        updateQuantity(
                                                        variant.idVariante,
                                                        item.cantidad + 1,
                                                        variant.stock
                                                        )
                                                    }
                                                    className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-gray-300 text-lg disabled:cursor-not-allowed disabled:text-gray-300"
                                                >
                                                    +
                                                </button>

                                            </div>


                                            <p className="mt-2 text-xs text-gray-400">
                                                Stock disponible: {variant.stock}
                                            </p>

                                            </div>


                                            <div className="text-right">

                                            <p className="text-sm text-gray-500">
                                                Subtotal
                                            </p>

                                            <p className="mt-1 text-xl font-bold text-slate-900">
                                                Q{(
                                                product.precio *
                                                item.cantidad
                                                ).toFixed(2)}
                                            </p>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                removeItem(
                                                    variant.idVariante
                                                )
                                                }
                                                className="mt-3 text-sm font-semibold text-red-600 hover:text-red-800"
                                            >
                                                Eliminar
                                            </button>

                                            </div>

                                        </div>

                                </div>
                        </article>
                    )
                )}
            </div>

            <aside>

                <div className="sticky top-8 rounded-2xl border border-gray-200 bg-white p-6">

                    <h2 className="text-2xl font-bold text-slate-900">
                        Resumen
                    </h2>


                    <div className="mt-6 flex justify-between text-gray-600">

                        <span>
                            Subtotal
                        </span>

                        <span>
                            Q{subtotal.toFixed(2)}
                        </span>

                    </div>


                        <div className="mt-4 flex justify-between text-gray-500">

                            <span>
                                Envío
                            </span>

                            <span>
                                Se calcula después
                            </span>

                        </div>


                        <div className="my-6 border-t border-gray-200" />


                            <div className="flex justify-between text-xl font-bold text-slate-900">

                                <span>
                                    Total provisional
                                </span>

                                <span>
                                    Q{subtotal.toFixed(2)}
                                </span>

                            </div>


                            <button
                            type="button"
                            onClick={handleContinuePurchase}
                            className="mt-7 w-full rounded-xl bg-slate-950 px-6 py-4 font-semibold text-white transition hover:bg-slate-700"
                            >
                            Continuar compra
                            </button>


                            <Link
                            to="/"
                            className="mt-4 block text-center text-sm font-semibold text-gray-600 hover:text-slate-900"
                            >
                            Seguir comprando
                            </Link>

                        </div>

                    </aside>

                </div>

            </main>
    )
}

export default Cart