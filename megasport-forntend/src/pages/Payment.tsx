import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import { identificarTarjetaPorNumero } from "../services/cardService";
import { autorizarPago } from "../services/cardService";
import { couriers } from "../data/couriers";
import type { PaymentAuthorizationResult } from "../types/card";

function Payment (){
    const {orderDraft, registerPaymentResult} = useOrder()
    const[ numeroTarjeta, setNumeroTarjeta] = useState('')
    const[titular, setTitular] = useState('')
    const[vencimiento, setVencimiento] = useState('')
    const [seguridad, setSeguridad] = useState('')
    const [processing, setProcessing] = useState(false)
    const [result, setResult] = useState<PaymentAuthorizationResult | null>(null)

    if(!orderDraft){
        <main className="mx-auto max-w-7xl px-6 py-16">

            <div className="rounded-2xl border border-gray-200 p-14 text-center">

                <h1 className="text-3xl font-bold text-slate-900">
                    No hay compras en proceso
                </h1>

                <Link
                    to="/carrito"
                    className="mt-8 inline-block rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white"
                >
                    Ir al carrito
                </Link>

            </div>

        </main>
    }

    if(!orderDraft?.idCourier){
        return(
            <main className="mx-auto max-w-7xl px-6 py-16">

                <div className="rounded-2xl border border-gray-200 p-14 text-center">

                    <h1 className="text-3xl font-bold text-slate-900">
                        Seleccione primero un Courier porfavor
                    </h1>

                    <Link
                        to="/checkout/courier"
                        className="mt-8 inline-block rounded-xl bg-slate-950 px-7 py-3 font-semibold text-white"
                    >
                        Elegir courier
                    </Link>

                </div>

            </main>
        )
    }

    const cleanCardNumber = numeroTarjeta.replace(/\D/g, '')

    const provider = identificarTarjetaPorNumero(cleanCardNumber)
    const cardNumberIsValid = /^\d{16}$/.test(cleanCardNumber)
    const holderIsValid = titular.trim().length >= 3
    const securityIsValid = /^\d{3,4}$/.test(seguridad)

    const validateExpiration = (value: string) => {
        if (!/^\d{6}$/.test(value)){
            return false
        }

        const year = Number(value.slice(0,4))
        const month = Number(value.slice(4, 6))

        if (month < 1 || month > 12){
            return false
        }

        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        if (year < currentYear){
            return false
        }

        if (year === currentYear && month < currentMonth){
            return false
        }

        return true
    }

    const expirationIsValid = validateExpiration(vencimiento)
    const formIsValid = cardNumberIsValid && holderIsValid && securityIsValid && expirationIsValid && provider !== null

    const selectedCourier = couriers.find((courier) => courier.identificador === orderDraft.idCourier)

    const handleCardChange = (value: string) =>{
        const cleanValue = value.replace(/\D/g,'').slice(0, 16)

        setNumeroTarjeta(cleanValue)
        setResult(null)

    }

    const handleSubmit = async () => {
        if(!formIsValid && processing || !provider){
            return
        }

        try{
            setProcessing(true)
            setResult(null)
            
            const response = await autorizarPago({
                numeroTarjeta: cleanCardNumber,
                titular: titular.trim(),
                vencimiento,
                seguridad,
                monto: orderDraft.total,
                tienda: 'MegaSport',
                formato: 'JSON'
            })

            setResult(response)

            registerPaymentResult({
                idTarjeta: response.issuerId,
                estadoDePagado: response.status,
                numAutorizacion: response.authorizationNumber
            })
        } finally {
            setProcessing(false)
        }
    }
    const paymentApproved = orderDraft.estadoDePagado === 'APROBADO'
    
    return(
        <main className="mx-auto max-w-7xl px-6 py-16">

            <div className="mb-10">

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Checkout
                </p>

                <h1 className="mt-2 text-4xl font-bold text-slate-900">
                    Pago
                </h1>

                <p className="mt-3 text-gray-500">
                    Ingresar los datos de la tarjeta
                </p>

            </div>


            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">


                <section>

                <div className="rounded-2xl border border-gray-200 bg-white p-7">

                    <h2 className="text-2xl font-bold text-slate-900">
                        Datos de tarjeta
                    </h2>


                    <div className="mt-7">

                        <label
                            htmlFor="numeroTarjeta"
                            className="block text-sm font-semibold text-slate-900"
                        >
                            Número de tarjeta
                        </label>


                        <input
                            id="numeroTarjeta"
                            type="text"
                            inputMode="numeric"
                            value={numeroTarjeta}
                            disabled={paymentApproved}
                            onChange={(event) => handleCardChange(event.target.value)}
                            placeholder="4001000000000002"
                            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-900 disabled:bg-gray-100"
                        />


                        <div className="mt-2 min-h-5">

                            {cleanCardNumber.length >= 1 && (

                            provider ? (

                                <p className="text-sm font-semibold text-green-700">
                                    Proveedor: {provider.nombre}
                                </p>

                            ) : (

                                <p className="text-sm font-semibold text-red-600">
                                    No se reconocio el proveedor
                                </p>

                            )

                            )}

                    </div>

                    </div>


                    <div className="mt-5">

                        <label
                            htmlFor="titular"
                            className="block text-sm font-semibold text-slate-900"
                        >
                            Nombre del titular
                        </label>

                        <input
                            id="titular"
                            type="text"
                            value={titular}
                            disabled={paymentApproved}
                            onChange={(event) => setTitular(event.target.value)}
                            placeholder="Nombre como aparece en la tarjeta"
                            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-900 disabled:bg-gray-100"
                        />

                    </div>


                    <div className="mt-5 grid gap-5 sm:grid-cols-2">

                    <div>

                        <label
                            htmlFor="vencimiento"
                            className="block text-sm font-semibold text-slate-900"
                        >
                            Vencimiento
                        </label>

                        <input
                            id="vencimiento"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={vencimiento}
                            disabled={paymentApproved}
                            onChange={(event) => setVencimiento(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="YYYYMM"
                            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-900 disabled:bg-gray-100"
                        />

                    </div>

                    <div>

                        <label
                            htmlFor="seguridad"
                            className="block text-sm font-semibold text-slate-900"
                        >
                            Código de seguridad
                        </label>

                        <input
                            id="seguridad"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={seguridad}
                            disabled={paymentApproved}
                            onChange={(event) =>setSeguridad(event.target.value.replace(/\D/g,'').slice(0, 4))}
                            placeholder="CVV"
                            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-900 disabled:bg-gray-100"
                        />

                    </div>

                    </div>


                    {result && (

                    <div
                        className={
                        result.status === 'APROBADO'

                            ? 'mt-7 rounded-xl border border-green-200 bg-green-50 p-5'

                            : 'mt-7 rounded-xl border border-red-200 bg-red-50 p-5'
                        }
                    >

                        <p
                        className={
                            result.status === 'APROBADO'

                            ? 'text-lg font-bold text-green-800'

                            : 'text-lg font-bold text-red-700'
                        }
                        >
                            Pago {result.status}
                        </p>


                        <p className="mt-2 text-sm text-gray-700">
                            {result.message}
                        </p>


                        {result.authorizationNumber && (

                        <p className="mt-3 text-sm font-semibold text-gray-800">
                            Autorización: {result.authorizationNumber}
                        </p>

                        )}

                    </div>

                    )}


                    {paymentApproved && !result && (

                    <div className="mt-7 rounded-xl border border-green-200 bg-green-50 p-5">

                        <p className="text-lg font-bold text-green-800">
                            Pago APROBADO
                        </p>

                        <p className="mt-2 text-sm text-gray-700">
                            Esta orden ya esta autorizada
                        </p>

                        <p className="mt-3 text-sm font-semibold text-gray-800">
                            Autorización: {orderDraft.numAutorizacion}
                        </p>

                    </div>

                    )}


                    <button
                        type="button"
                        disabled={!formIsValid || processing || paymentApproved}
                        onClick={handleSubmit}
                        className="mt-8 w-full rounded-xl bg-slate-950 px-6 py-4 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >

                    {processing
                        ? 'Solicitando autorización...' : paymentApproved
                        ? 'Pago autorizado' : `Pagar Q${orderDraft.total.toFixed(2)}`}

                    </button>


                    <p className="mt-4 text-center text-xs text-gray-400">
                        Los datos de la tarjeta no se almacenan en MegaSport por lo que es 100% seguro :D
                    </p>

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
                            Q{orderDraft.subtotalAntesDeEnvio.toFixed(2)}
                        </span>

                    </div>


                    <div className="mt-4 flex justify-between text-gray-600">

                        <span>
                            Envío
                        </span>

                        <span>
                            Q{orderDraft.costoEnvio.toFixed(2)}
                        </span>

                    </div>


                    <div className="mt-4 text-sm text-gray-500">

                        <p>
                            Courier:
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                            {selectedCourier?.nombre ?? orderDraft.idCourier}
                        </p>

                    </div>


                    <div className="my-6 border-t border-gray-200" />


                        <div className="flex justify-between text-xl font-bold text-slate-900">

                            <span>
                                Total
                            </span>

                            <span>
                                Q{orderDraft.total.toFixed(2)}
                            </span>

                    </div>


                    <Link
                        to="/checkout/courier"
                        className="mt-6 block text-center text-sm font-semibold text-gray-500 hover:text-slate-900"
                        >
                        Cambiar a otro courier
                    </Link>

                </div>

                </aside>

            </div>

            </main>
    )
}
export default Payment