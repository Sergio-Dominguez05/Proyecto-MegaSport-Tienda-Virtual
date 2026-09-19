import { NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Navbar(){

    const {totalItems} = useCart()
    return(
        <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <NavLink
                    to="/"
                    className="text-2xl font-bold tracking-wide text-slate-900"
                >    
                    MEGASPORT
                </NavLink>


                <nav className="flex items-center gap-8">
                    <NavLink
                        to="/"
                        className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                        Inicio
                    </NavLink>

                    <NavLink
                        to="/categoria/hombre"
                        className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                        Hombre
                    </NavLink>

                    <NavLink
                        to="/categoria/mujer"
                        className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                        Mujer
                    </NavLink>

                    <NavLink
                        to="/categoria/ninos"
                        className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                        Niños
                    </NavLink>

                    <NavLink
                        to="/categoria/zapatos"
                        className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                        Zapatos
                    </NavLink>

                    <NavLink
                        to="/carrito"
                        className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                        Carrito ({totalItems})
                    </NavLink>

                </nav>
                
            </div>
        </header>
    )
}
export default Navbar