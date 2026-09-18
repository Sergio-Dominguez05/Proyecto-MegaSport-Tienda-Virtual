import { Link } from "react-router-dom"
import CateogryCard from "../components/CategoryCard"
import ProductCard from "../components/ProductCard"
import Category from "./Category"

function Home(){
    const categories = [
        {
            title: 'Hombre',
            subtitle: 'Ropa para caballero de calidad para maximo rendimiento',
            link: '/categoria/hombre',
            image: 'https://cdn.pixabay.com/photo/2017/03/13/20/02/tyre-push-2140997_1280.jpg'
        },
        {
            title: 'Mujer',
            subtitle: 'Ropa de dama para entrenar a tu estilo',
            link: '/categoria/mujer',
            image: 'https://cdn.pixabay.com/photo/2018/01/01/01/56/yoga-3053487_1280.jpg'
        },
        {
            title: 'Niños',
            subtitle: 'Ropa de niños y niñas para los pequeños atletas de la casa',
            link: '/categoria/ninos',
            image: 'https://cdn.pixabay.com/photo/2026/06/26/19/03/19-03-49-655_1280.jpg'
        },
        {
            title: 'Zapatos',
            subtitle: 'Calzado deportivo de la mejor calidad',
            link: '/categoria/zapatos',
            image: 'https://cdn.pixabay.com/photo/2016/11/19/18/06/feet-1840619_1280.jpg'
        }    
    ]

    const featuredProducts = [
        {
            id: 1,
            name: 'Camiseta Running Pro',
            category: 'Hombre',
            price: 249.99,
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
            available: true,
        },
        {
            id: 2,
            name: 'Leggings Training',
            category: 'Mujer',
            price: 299.99,
            image:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=700&q=80',
            available: true,
        },

        {
            id: 3,
            name: 'Tenis Performance xl',
            category: 'Zapatos',
            price: 599.99,
            image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
            available: true,
        },

        {
            id: 4,
            name: 'Sudadera Sport',
            category: 'Hombre',
            price: 349.99,
            image:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
            available: false,
        },
    ]
    return(
        <main>
            <section className="bg-slate-950 text-white">

                <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">

                <div>

                    <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">
                    Nueva colección 2026
                    </p>

                    <h1 className="text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
                    Entrena.
                    <br />
                    Supera tus límites.
                    </h1>

                    <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">
                    Descubre ropa, calzado y accesorios diseñados para acompañarte
                    en cada entrenamiento.
                    </p>

                    <div className="mt-9 flex flex-wrap gap-4">

                    <Link
                        to="/categoria/hombre"
                        className="rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-gray-200"
                    >
                        Comprar ahora
                    </Link>

                    <a
                        href="#categorias"
                        className="rounded-xl border border-gray-600 px-7 py-3.5 font-semibold transition hover:border-white hover:bg-white/10"
                    >
                        Ver categorías
                    </a>

                    </div>

                </div>


                <div className="hidden lg:block">

                    <div className="overflow-hidden rounded-3xl">

                    <img
                        src="https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1100&q=85"
                        alt="Atleta entrenando"
                        className="h-[500px] w-full object-cover"
                    />

                    </div>

                </div>

                </div>

            </section>

             <section className="border-b border-gray-200 bg-white">

                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 text-center md:grid-cols-3">

                <div>
                    <p className="font-semibold text-slate-900">
                    Envíos a toda Guatemala
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                    Elige el courier que más te convenga.
                    </p>
                </div>


                <div>
                    <p className="font-semibold text-slate-900">
                    Pago seguro
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                    Visa, Mastercard y Credomatic.
                    </p>
                </div>


                <div>
                    <p className="font-semibold text-slate-900">
                    Productos disponibles
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                    Consulta existencias antes de comprar.
                    </p>
                </div>

                </div>

            </section>

            <section
                id="categorias"
                className="mx-auto max-w-7xl px-6 py-20">
            
                <div className="mb-10">
                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                        Explorar
                    </p>
                    <h2 className="mt-2 text-4xl font-bold text-slate-900">
                        Ver las categorias
                    </h2>
                </div>
                

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {categories.map((category) => (
                        <CateogryCard
                            key={category.title}
                            title={category.title}
                            subtitle={category.subtitle}
                            image={category.image}
                            link={category.link}
                        />
                    ))}
                </div>
            </section>

            <section  className="bg-gray-50">
                <div className="mx-auto max-w-7xl px-6 py-20">
                    <div className="mb-10 flex items-end justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                                Recomendados
                            </p>
                            <h2 className="mt-2 text-4xl font-bold text-slate-900">
                                Productos Destacados
                            </h2>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {featuredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                category={product.category}
                                price={product.price}
                                image={product.image}
                                available={product.available}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20">

                <div className="overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 text-white md:px-16">

                    <div className="max-w-2xl">

                        <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                        MegaSport
                        </p>

                        <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                        Todo lo que necesitas para tu próximo entrenamiento.
                        </h2>

                        <p className="mt-5 text-lg text-gray-300">
                        Encuentra ropa deportiva, calzado y accesorios para hombre,
                        mujer y niños.
                        </p>

                        <Link
                        to="/categoria/hombre"
                        className="mt-8 inline-block rounded-xl bg-white px-7 py-3 font-semibold text-slate-950 transition hover:bg-gray-200"
                        >
                        Explorar productos
                        </Link>

                    </div>
                </div>
            </section>
        </main>
    )
}
export default Home