import { useParams } from "react-router-dom"

function Category (){

    const { category } = useParams()
    const categoryNames: Record<string, string> = {
        hombre: 'Hombre',
        mujer: 'Mujer',
        ninos: 'Niños',
        zapatos: 'Zapatos',
    }

    const title = categoryNames[category ?? ''] ?? 'Categoria'

    return(
        <main className="mx-auto max-w-7x1 px-6 py-12">
            <h1 className="text-4x1 font-bold text-slate-900">
                {title}
            </h1>
            <p className="mt-3 text-gray-900">
                Explora Nuestra seleccionde productos deportivos para {title.toLowerCase()}
            </p>
            <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                Los productos de la categoria van a aparecer aqui mas adelante
            </div>
        </main>
    )


}

export default Category