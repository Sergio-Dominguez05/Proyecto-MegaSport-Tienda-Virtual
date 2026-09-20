import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import { products } from "../data/products";
import { useNavigate } from "react-router-dom";

function Checkout () {
    const { orderDraft, updateShippingData} = useOrder()

    const navigate = useNavigate()

    const [direccion, setDireccion] = useState(orderDraft?.direccionDeEnvio ?? '')

    const [
        codigoDestino,
        setCodigoDestino
    ] = useState(orderDraft?.codigoDelDestino ?? '')

    if (!orderDraft){
        return(
            <main className="mx-auto max-w-7xl px-6 py-16">

                <div className="rounded-2xl border border-gray-200 p-14 text-center">

                    <h1 className="text-3xl font-bold text-slate-900">
                        No hay una compra en proceso
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Si quieres continuar primero agrega productos al carrito
                    </p>

                    <Link
                        to="/carrito"
                        className="mt-8 inline-block rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white"
                    >
                        Ir al carrito
                    </Link>

                </div>

            </main>

        )
    }

    const detailedItems = orderDraft.detalles.flatMap((detail) => {
        const product = products.find((product) => product.variantes.some((variant) => variant.idVariante === detail.idVariante))

        if (!product){
            return[]
        }

        const variant = product.variantes.find((variant) => variant.idVariante === detail.idVariante)

        if (!variant){
            return[]
        }

        return[{detail, product, variant}]
    })

    const destinationIsValid = codigoDestino.trim().length === 5

    const addressIsValid = direccion.trim().length === 5

    const formIsValid = destinationIsValid && addressIsValid

    const handleSaveShipping = () => {
        if (!formIsValid){
            return
        }
        updateShippingData({
            direccionDeEnvio: direccion.trim(),
            codigoDelDestino: codigoDestino.trim()
        })
        navigate('/checkout/courier')
    }

    return(
        <main className="mx-auto max-w-7xl px-6 py-16">

        <div className="mb-10">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Checkout
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
                Datos de entrega
            </h1>

            <p className="mt-3 text-gray-500">
                Confirmar en donde se quiere recibir el producto
            </p>

        </div>


        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">

            <section>

            <div className="rounded-2xl border border-gray-200 bg-white p-7">

                <h2 className="text-2xl font-bold text-slate-900">
                    Dirección
                </h2>


                <div className="mt-7">

                <label
                    htmlFor="direccion"
                    className="block text-sm font-semibold text-slate-900"
                >
                    Dirección de envío
                </label>

                <textarea
                    id="direccion"
                    value={direccion}
                    onChange={(event) =>
                    setDireccion(
                        event.target.value
                    )
                    }
                    rows={4}
                    placeholder="Ej. calle Dr. Eduardo Suger Cofiño, Zona 10, Universidad Galileo "
                    className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />

                </div>


                <div className="mt-6">

                <label
                    htmlFor="codigoDestino"
                    className="block text-sm font-semibold text-slate-900"
                >
                    Código de destino
                </label>

                <input
                    id="codigoDestino"
                    type="text"
                    maxLength={5}
                    value={codigoDestino}
                    onChange={(event) =>
                    setCodigoDestino(
                        event.target.value
                    )
                    }
                    placeholder="00001"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />

                <p className="mt-2 text-xs text-gray-500">
                    El código de destino debe de ser de 5 caracteres.
                </p>

                </div>


                <button
                type="button"
                disabled={!formIsValid}
                onClick={handleSaveShipping}
                className="mt-8 w-full rounded-xl bg-slate-950 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Guardar y continuar a metodos de entrega
                    </button>

            </div>

            </section>

            <aside>

            <div className="sticky top-8 rounded-2xl border border-gray-200 bg-white p-6">

                <h2 className="text-2xl font-bold text-slate-900">
                    Resumen de compra
                </h2>


                <div className="mt-6 space-y-5">

                {detailedItems.map(
                    ({
                    detail,
                    product,
                    variant,
                    }) => (

                    <div
                        key={variant.idVariante}
                        className="flex gap-4"
                    >

                        <img
                        src={product.urlImg}
                        alt={product.nombre}
                        className="h-20 w-20 rounded-lg object-cover"
                        />


                        <div className="flex-1">

                        <p className="font-semibold text-slate-900">
                            {product.nombre}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {variant.color} / {variant.talla}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Cantidad: {detail.cantidad}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            Q{(detail.precioPorUnidad * detail.cantidad).toFixed(2)}
                        </p>

                        </div>

                    </div>

                    )
                )}

                </div>


                <div className="my-6 border-t border-gray-200" />


                <div className="flex justify-between text-gray-600">

                <span>
                    Subtotal
                </span>

                <span>
                    Q
                    {orderDraft
                    .subtotalAntesDeEnvio
                    .toFixed(2)}
                </span>

                </div>


                <div className="mt-4 flex justify-between text-gray-500">

                <span>
                    Envío
                </span>

                <span>
                    Pendiente
                </span>

                </div>


                <div className="my-6 border-t border-gray-200" />


                <div className="flex justify-between text-xl font-bold text-slate-900">

                <span>
                    Total provisional antes de envio
                </span>

                <span>
                    Q{orderDraft.subtotalAntesDeEnvio.toFixed(2)}
                </span>

                </div>


                <Link
                to="/carrito"
                className="mt-6 block text-center text-sm font-semibold text-gray-500 hover:text-slate-900"
                >
                    Regresar al carrito
                </Link>

            </div>

            </aside>

        </div>

        </main>
    )
}

export default Checkout