import { Link } from "react-router-dom";

function NotFound (){
    return (
        <main className="felx min-h-[70vh] items-center justify-center px-6">
            <div className="text-center">
                <h1 className="text-7xl font-bold text-slate-900">
                    404
                </h1>
                <p className="mt-4 text-lg text-gray-600">
                    La pagina buscada no existe
                </p>
                <Link
                    to="/"
                    className="mt-8 inline-block rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-700"
                >
                    Volver al inicio
                </Link>
            </div>
        </main>
    )
}

export default NotFound