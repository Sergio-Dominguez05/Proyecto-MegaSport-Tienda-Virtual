import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js'
import { authorizeCard, quoteAllCouriers, requestShipment, requestShipmentStatus } from '../services/integrationService.js'
import type { ExternalFormat } from '../services/externalHttpService.js'
import { HttpError } from '../utils/httpError.js'

function requiredString(value: unknown, field: string): string {
    const result = typeof value === 'string' ? value.trim() : ''
    if (!result) throw new HttpError(400, `${field} es obligatorio`)
    return result
}

function optionalFormat(
    value: unknown
): ExternalFormat | undefined {

    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return undefined
    }

    const result =
        String(value).toUpperCase()

    if (
        result !== 'JSON' &&
        result !== 'XML'
    ) {
        throw new HttpError(
            400,
            'formato debe ser JSON o XML'
        )
    }

    return result
}




function handleError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message })
        return
    }
    console.error('Error de integración externa:', error)
    res.status(500).json({ message: 'No se pudo completar la integración externa' })
}

export async function quoteCouriers(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {

    try {

        const destino = requiredString(
            req.query.destino,
            'destino'
        )

        if (!/^\d{5}$/.test(destino)) {
            throw new HttpError(
                400,
                'destino debe contener 5 dígitos'
            )
        }

        res.json(
            await quoteAllCouriers(
                destino,
                optionalFormat(req.query.formato)
            )
        )

    } catch (error) {
        handleError(error, res)
    }
}

export async function createShipment(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {

    try {

        const formato = optionalFormat(
            req.body.formato
        )

        res.json(
            await requestShipment(
                requiredString(
                    req.params.courierId,
                    'courierId'
                ),
                {
                    orden: requiredString(
                        req.body.orden,
                        'orden'
                    ),

                    destinatario: requiredString(
                        req.body.destinatario,
                        'destinatario'
                    ),

                    destino: requiredString(
                        req.body.destino,
                        'destino'
                    ),

                    direccion: requiredString(
                        req.body.direccion,
                        'direccion'
                    ),

                    ...(formato !== undefined
                        ? { formato }
                        : {})
                }
            )
        )

    } catch (error) {
        handleError(error, res)
    }
}

export async function shipmentStatus(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {

    try {

        res.json(
            await requestShipmentStatus(
                requiredString(
                    req.params.courierId,
                    'courierId'
                ),

                requiredString(
                    req.query.orden,
                    'orden'
                ),

                optionalFormat(
                    req.query.formato
                )
            )
        )

    } catch (error) {
        handleError(error, res)
    }
}

export async function authorizePayment(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {

    try {

        const tarjeta = requiredString(
            req.body.numeroTarjeta,
            'numeroTarjeta'
        ).replace(/\D/g, '')

        const seguridad = requiredString(
            req.body.seguridad,
            'seguridad'
        )

        const monto = Number(
            req.body.monto
        )

        if (!/^\d{13,19}$/.test(tarjeta)) {
            throw new HttpError(
                400,
                'El número de tarjeta no es válido'
            )
        }

        if (!/^\d{3,4}$/.test(seguridad)) {
            throw new HttpError(
                400,
                'El código de seguridad no es válido'
            )
        }

        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {
            throw new HttpError(
                400,
                'El monto no es válido'
            )
        }
        const formato = optionalFormat(
            req.body.formato
        )

        res.json(
            await authorizeCard({
                tarjeta,

                nombre: requiredString(
                    req.body.titular,
                    'titular'
                ),

                fechaVencimiento:
                    requiredString(
                        req.body.vencimiento,
                        'vencimiento'
                    ),

                numeroSeguridad:
                    seguridad,

                monto,

                ...(formato !== undefined
                    ? { formato }
                    : {})
            })
        )
    } catch (error) {
        handleError(error, res)
    }
}