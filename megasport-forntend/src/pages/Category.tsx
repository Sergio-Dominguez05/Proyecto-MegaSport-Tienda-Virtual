import { useParams } from "react-router-dom"
import ProductCard from "../components/ProductCard"
import { products } from "../data/products"

function Category (){

    const { category } = useParams()
    const categoryNames: Record<string, string> = {
        hombre: 'Hombre',
        mujer: 'Mujer',
        ninos: 'Niños',
        zapatos: 'Zapatos',
    }

    const title = categoryNames[category ?? ''] ?? 'Categoria'

    const filteredProducts = products.filter(
        (product) =>
            product.categoria === category &&
            product.activo
    )

    return(
        <main>

            <section className="bg-slate-950 text-white">

                <div className="mx-auto max-w-7xl px-6 py-16">

                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">
                    MegaSport
                </p>

                <h1 className="mt-3 text-5xl font-bold">
                    {title}
                </h1>

                <p className="mt-4 max-w-xl text-gray-300">
                    Explora nuestra selección de productos deportivos.
                </p>

                </div>

            </section>

            <section className="mx-auto max-w-7xl px-6 py-16">

                <div className="mb-8 flex items-center justify-between">

                    <div>

                        <p className="text-sm text-gray-500">
                        Productos encontrados
                        </p>

                        <p className="mt-1 text-xl font-semibold text-slate-900">
                        {filteredProducts.length}
                        </p>

                    </div>

                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-">
                        {filteredProducts.map((product) => {
                            const available = product.variantes.some(
                                (variant) =>
                                    variant.activo &&
                                    variant.stock > 0
                            )

                            return(
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.nombre}
                                    category={product.categoria}
                                    price={product.precio}
                                    image={product.urlImg}
                                    available={available} 
                                />
                            )
                        })}
                    </div>

                ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center">
                        <h2 className="text-xl font-semibold text-slate-900">
                            No hay productos disponibles
                        </h2>
                        <p className="mt-2 text-gray-500">
                            Actualmente no tenemos productos de esta categoria
                        </p>
                    </div>
                )}
            </section>
        </main>
    )


}

export default Category