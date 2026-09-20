import { useState } from "react"
import { Link } from "react-router-dom"
import { useParams } from "react-router-dom"
import { useOrder } from "../context/OrderContext"
import { consultarEstadoEnvio } from "../services/courierService"
import { SHIPPING_STATUS_LABELS } from "../types/courier"
import { couriers } from "../data/couriers"
import { products } from "../data/products"

function OrderConfirmation (){
    const {id} = useParams()


    const {completedOrders, updateOrderShippingStatus} = useOrder()
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState('')
    const order = completedOrders.find((order) => order.id === id)

    if (!order ){
        return (
        <main className="mx-auto max-w-7xl px-6 py-16">

            <div className="rounded-2xl border border-gray-200 p-14 text-center">

                <h1 className="text-3xl font-bold text-slate-900">
                    No se encontro la orden D:
                </h1>

                <Link
                    to="/"
                    className="mt-8 inline-block rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white"
                >
                    Volver al inicio
                </Link>

            </div>

        </main>
        )
    }

    const courier = couriers.find((courier) => courier.identificador === order.idCourier)

    const detailedItems =order.detalles.flatMap((detail) => {
        const product = products.find((product) => product.variantes.some((variant) =>variant.idVariante === detail.idVariante))

            if(!product){
                return []
            }

            const variant =product.variantes.find((variant) => variant.idVariante === detail.idVariante)

            if(!variant) {
                return []
            }

            return [{
                detail,
                product,
                variant,
            }]
        })

    const handleUpdateStatus = async () => {
        try {
            setUpdating(true)
            setError('')

            const result = await consultarEstadoEnvio(order.idCourier, order.numEnvio)

            updateOrderShippingStatus(order.id, result.estadoEnvio)
        } catch (error) {
            if(error instanceof Error){
                setError(error.message)
            } else {
                setError('No se pudo consultar el estado')
            }
        } finally {
            setUpdating(false)
        }
    }


    
    return(
        <main className="mx-auto max-w-7xl px-6 py-16">

            {/* CONFIRMACIÓN */}
            <div className="rounded-3xl bg-green-50 p-8">

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                    Compra completada
                </p>

                <h1 className="mt-3 text-4xl font-bold text-slate-900">
                    Orden Confirmada :D
                </h1>

                <p className="mt-3 text-gray-600">
                    El pago se autorizo y el envío se solicito correctamente.
                </p>

            </div>


            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">


                <section className="space-y-6">

                <div className="rounded-2xl border border-gray-200 bg-white p-7">

                    <h2 className="text-2xl font-bold text-slate-900">
                        Información de la orden
                    </h2>


                    <div className="mt-6 grid gap-6 sm:grid-cols-2">

                        <div>

                            <p className="text-sm text-gray-500">
                                Número de orden
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {order.id}
                            </p>

                        </div>


                    <div>

                        <p className="text-sm text-gray-500">
                            Autorización
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {order.numAutorizacion}
                        </p>

                    </div>


                    <div>

                        <p className="text-sm text-gray-500">
                            Courier
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {courier?.nombre ?? order.idCourier}
                        </p>

                    </div>


                    <div>

                        <p className="text-sm text-gray-500">
                            Número de envío
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {order.numEnvio}
                        </p>

                    </div>

                    </div>

                </div>


                <div className="rounded-2xl border border-gray-200 bg-white p-7">

                    <div className="flex flex-wrap items-center justify-between gap-4">

                        <div>

                            <h2 className="text-2xl font-bold text-slate-900">
                                Seguimiento del envío
                            </h2>

                            <p className="mt-2 text-gray-500">
                                Estado actual:{' '}

                            <span className="font-semibold text-slate-900">
                                {SHIPPING_STATUS_LABELS[order.estadoEnvio]}
                            </span>

                            </p>

                        </div>


                        <button
                            type="button"
                            disabled={updating || order.estadoEnvio === 5}
                            onClick={handleUpdateStatus}
                            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >

                            {updating ? 'Consultando...' : order.estadoEnvio === 5 ? 'Entregado' : 'Actualizar estado'}

                        </button>

                    </div>


                    {error && (

                    <p className="mt-4 text-sm font-semibold text-red-600">
                        {error}
                    </p>

                    )}

                    <div className="mt-8 space-y-4">

                        {([1,2,3,4,5,] as const).map((status) => {

                            const completed = status <= order.estadoEnvio

                            return (

                                <div
                                    key={status}
                                    className="flex items-center gap-4"
                                >

                                <div
                                    className={
                                    completed
                                        ? 'flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white'
                                        : 'flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-500'
                                    }
                                >
                                    {status}
                                </div>


                                <p
                                    className={
                                    completed
                                        ? 'font-semibold text-slate-900'
                                        : 'text-gray-400'
                                    }
                                >
                                    {SHIPPING_STATUS_LABELS[status]}
                                </p>

                                </div>

                            )

                            }
                        )}

                    </div>

                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-7">

                    <h2 className="text-2xl font-bold text-slate-900">
                        Productos
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
                            className="flex gap-4 border-b border-gray-100 pb-5 last:border-none"
                        >

                            <img
                                src={product.urlImg}
                                alt={product.nombre}
                                className="h-20 w-20 rounded-lg object-cover"
                            />


                            <div>

                                <p className="font-semibold text-slate-900">
                                    {product.nombre}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    {variant.color}{' / '}{variant.talla}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    Cantidad:{' '}{detail.cantidad}
                                </p>

                            </div>

                        </div>

                        )
                    )}

                    </div>

                </div>

                </section>


                <aside>

                <div className="sticky top-8 rounded-2xl border border-gray-200 bg-white p-6">

                    <h2 className="text-2xl font-bold text-slate-900">
                        Resumen
                    </h2>


                    <div className="mt-6 flex justify-between text-gray-600">

                        <span>
                            Productos
                        </span>

                        <span>
                            Q{order.subtotalAntesDeEnvio.toFixed(2)}
                        </span>

                    </div>


                    <div className="mt-4 flex justify-between text-gray-600">

                        <span>
                            Envío
                        </span>

                        <span>
                            Q{order.costoEnvio.toFixed(2)}
                        </span>

                    </div>


                    <div className="my-6 border-t border-gray-200" />


                        <div className="flex justify-between text-xl font-bold text-slate-900">

                            <span>
                                Total
                            </span>

                            <span>
                                Q{order.total.toFixed(2)}
                            </span>

                        </div>


                    <div className="mt-6 rounded-xl bg-gray-50 p-4">

                        <p className="text-sm text-gray-500">
                            Enviar a
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {order.direccionDeEnvio}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Código:{' '}{order.codigoDelDestino}
                        </p>

                        </div>


                        <Link
                            to="/"
                            className="mt-6 block rounded-xl bg-slate-950 px-6 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
                        >
                            Volver a la tienda
                        </Link>

                    </div>

                </aside>

            </div>

        </main>
    )
}

export default OrderConfirmation