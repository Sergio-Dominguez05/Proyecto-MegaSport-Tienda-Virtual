import { Link } from "react-router-dom"

type ProductCardProps = {
    id: number
    name: string
    category: string
    price: number
    image: string
    available: boolean
}

function ProductCard ({
    id,
    name,
    category,
    price,
    image,
    available
}: ProductCardProps) {
    return (
        <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition">
            <Link
                to={`/producto/${id}`}>
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img 
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {!available && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                                No Disponible
                            </span>
                        </div>
                    )}
                </div>

            </Link>

            <div className="p-5">
                <p className="text-sm text-gray-500">
                    {category}
                </p>
                <Link to={`/producto/${id}`}>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {name}
                    </h3>
                </Link>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-900">
                        Q{price.toFixed(2)}
                    </span>

                    <Link
                        to={`/producto/${id}`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                        Ver producto
                    </Link>
                </div>
            </div>
        </article>

    )
}

export default ProductCard