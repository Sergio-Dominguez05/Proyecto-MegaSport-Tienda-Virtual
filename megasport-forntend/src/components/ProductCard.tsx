type ProductCardProps = {
    name: string
    category: string
    price: number
    image: string
    avilable: boolean
}

function ProductCard ({
    name,
    category,
    price,
    image,
    avilable
}: ProductCardProps) {
    return (
        <article className="group overflow-hidden rounded-2x1 border border-gray-200 bg-white shadow-sm transition">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img 
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                {!avilable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                            No Disponible
                        </span>
                    </div>
                )}
            </div>

            <div className="p-5">
                <p className="text-sm text-gray-500">
                    {category}
                </p>
                
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {name}
                </h3>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-900">
                        Q{price.toFixed(2)}
                    </span>

                    <button 
                        disabled={!avilable}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover bg-slate-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                            Agregar
                    </button>
                </div>
            </div>
        </article>

    )
}

export default ProductCard