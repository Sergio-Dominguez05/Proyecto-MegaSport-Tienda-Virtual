import { Link } from "react-router-dom";

function Footer (){
    return(
        <footer className="mt-20 bg-slate-950 text-gray-300">
            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold tracking-wide text-white">
                        MEGASPORT
                    </h2>

                    <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
                        Ropa, calzado y accesorios para estar contigo en cada enteno.
                    </p>
                </div>

                <div>
                    <h3 className="font-semibold text-white">
                        Categorias
                    </h3>

                    <div className="mt-4 flex flex-col gap-3 text-sm">
                        <Link
                            to="/categoria/hombre"
                            className="hover:text-white">
                                Hombres
                        </Link>

                        <Link
                            to="/categoria/mujer"
                            className="hover:text-white">
                                Mujer
                        </Link>

                        <Link
                            to="/categoria/ninos"
                            className="hover:text-white">
                                Niños
                        </Link>

                        <Link
                            to="/categoria/zapatos"
                            className="hover:text-white">
                                Zapatos
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-white">
                        MegaSport
                    </h3>

                    <div className="mt-4 flex flex-col gap-3 text-sm">
                        <Link
                            to="/"
                            className="hover:text-white">
                                Inicio
                        </Link>

                        <Link
                            to="/carrito"
                            className="hover:text-white">
                                Carrito
                        </Link>

                    </div>
                </div>

            </div>

            <div className="border-t border-slate-800 px-6 py-5 text-center text-sm text-gray-500">
                Proyecto 1 de CC6
            </div>
        </footer>
    )
}

export default Footer