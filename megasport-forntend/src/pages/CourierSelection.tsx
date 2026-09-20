import { useCallback } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import { consultarTodosLosCouriers } from "../services/courierService";
import type { CourierQuote } from "../types/courier";

function CourierSelection(){
    const {orderDraft, selectCourier} = useOrder()

    const [quotes, setQuotes] = useState<CourierQuote[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedCourier, setSelectedCourier] = useState<string | null>(orderDraft?.idCourier ?? null)
    const consultarCouriers = useCallback(async () => {
        if (!orderDraft?.codigoDelDestino){
            return
        }

        try {
            setLoading(true)
            setError('')
            setQuotes([])
            const results = await consultarTodosLosCouriers(orderDraft.codigoDelDestino)
            setQuotes(results)
        } catch {
            setError('Hubo un porblema intentando consultar con los couriers')
        } finally {
            setLoading(false)
        }
    }, [orderDraft?.codigoDelDestino])

    useEffect(() => { void consultarCouriers()}, [consultarCouriers])

    if (!orderDraft){
        return (
            <main className="mx-auto max-w-7xl px-6 py-16">

                <div className="rounded-2xl border border-gray-200 p-14 text-center">

                    <h1 className="text-3xl font-bold text-slate-900">
                        No hay una compra en proceso
                    </h1>

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

    if (!orderDraft.codigoDelDestino){
        return(
              <main className="mx-auto max-w-7xl px-6 py-16">

                    <div className="rounded-2xl border border-gray-200 p-14 text-center">

                        <h1 className="text-3xl font-bold text-slate-900">
                            No hay datos de entrega
                        </h1>

                        <Link
                            to="/checkout"
                            className="mt-8 inline-block rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white"
                        >
                            Ir a Completar datos
                        </Link>

                    </div>

                </main>
        )
    }

    const selectedQuote = quotes.find((quote) => quote.courierId === selectedCourier)
    const handleSelectCourier = (quote: CourierQuote) => {
        if (!quote.cobertura || quote.costoEnvio === null){
            return
        }

        setSelectedCourier(quote.courierId)
        selectCourier({idCourier: quote.courierId, costoEnvio: quote.costoEnvio})
    }

    const handleContinuePayment = () => {
        if (!selectedQuote){
            return
        }
        alert('Aqui ya se selecciono bien el courier, esta onda despues va a manejar el pago de la tarjeta')
    }

    return(
            <main className="mx-auto max-w-7xl px-6 py-16">

                <div>

                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Checkout
                    </p>

                    <h1 className="mt-2 text-4xl font-bold text-slate-900">
                        Método de entrega
                    </h1>

                </div>


                <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">

                    <section>

                        <div className="mb-6 rounded-2xl bg-gray-50 p-5">

                            <p className="text-sm text-gray-500">
                                Destino
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {orderDraft.direccionDeEnvio}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Código: {orderDraft.codigoDelDestino}
                            </p>

                        </div>


                        {loading && (

                            <div className="rounded-2xl border border-gray-200 p-14 text-center">

                                <p className="text-lg font-semibold text-slate-900">
                                    Consultando couriers...
                                </p>

                                <p className="mt-2 text-sm text-gray-500">
                                    Estamos verificando cobertura y costos de envío.
                                </p>

                            </div>

                        )}


                        {error && (

                            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

                                <p className="font-semibold text-red-700">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                    consultarCouriers
                                    }
                                    className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white"
                                >
                                    Intentar otra vez
                                </button>

                            </div>

                        )}


                        {!loading &&
                            !error &&
                            quotes.length > 0 && (

                            <div className="space-y-4">

                                {quotes.map(
                                (quote) => {

                                    const selected =
                                    selectedCourier ===
                                    quote.courierId


                                    return (

                                    <button
                                        key={
                                        quote.courierId
                                        }
                                        type="button"
                                        disabled={
                                        !quote.cobertura
                                        }
                                        onClick={() =>
                                        handleSelectCourier(
                                            quote
                                        )
                                        }
                                        className={
                                        selected

                                            ? 'w-full rounded-2xl border-2 border-slate-950 bg-slate-50 p-6 text-left'

                                            : quote.cobertura

                                            ? 'w-full rounded-2xl border border-gray-200 bg-white p-6 text-left transition hover:border-slate-900'

                                            : 'w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left opacity-60'
                                        }
                                    >

                                        <div className="flex flex-wrap items-center justify-between gap-5">

                                        <div>

                                            <div className="flex items-center gap-3">

                                            <h2 className="text-xl font-bold text-slate-900">
                                                {quote.courierName}
                                            </h2>


                                            {selected && (

                                                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                                                    Seleccionado
                                                </span>

                                            )}

                                            </div>


                                            <p className="mt-2 text-sm text-gray-500">
                                                {quote.mensaje}
                                            </p>

                                        </div>


                                        {quote.cobertura &&
                                        quote.costoEnvio !== null ? (

                                            <div className="text-right">

                                            <p className="text-sm text-gray-500">
                                                Envío
                                            </p>

                                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                                Q
                                                {quote
                                                .costoEnvio
                                                .toFixed(2)}
                                            </p>

                                            </div>

                                        ) : (

                                            <p className="font-semibold text-red-600">
                                                Sin cobertura
                                            </p>

                                        )}

                                        </div>

                                    </button>

                                    )

                                }
                                )}

                            </div>

                            )}


                        {!loading &&
                            quotes.length > 0 && (

                            <button
                                type="button"
                                onClick={
                                consultarCouriers
                                }
                                className="mt-6 text-sm font-semibold text-gray-500 hover:text-slate-900"
                            >
                                Consultar nuevamente
                                </button>

                            )}

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
                                Q
                                {orderDraft
                                .subtotalAntesDeEnvio
                                .toFixed(2)}
                            </span>

                        </div>


                        <div className="mt-4 flex justify-between text-gray-600">

                            <span>
                                Envío
                            </span>

                            <span>

                                {orderDraft.idCourier? `Q${orderDraft.costoEnvio.toFixed(2)}`: 'Pendiente'}

                            </span>

                        </div>


                        <div className="my-6 border-t border-gray-200" />


                            <div className="flex justify-between text-xl font-bold text-slate-900">

                                <span>
                                    Total
                                </span>

                                <span>
                                    Q
                                    {orderDraft
                                    .total
                                    .toFixed(2)}
                                </span>

                            </div>


                            <button
                            type="button"
                            disabled={
                                !orderDraft.idCourier
                            }
                            onClick={
                                handleContinuePayment
                            }
                            className="mt-7 w-full rounded-xl bg-slate-950 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                            Continuar al pago
                            </button>


                            <Link
                            to="/checkout"
                            className="mt-4 block text-center text-sm font-semibold text-gray-500 hover:text-slate-900"
                            >
                            ← Cambiar dirección
                            </Link>

                        </div>

                    </aside>

                </div>

            </main>
    )
}

export default CourierSelection