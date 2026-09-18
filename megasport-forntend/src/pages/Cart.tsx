function Cart (){
    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <h1 className="text-4xl font-bold text-slate-900">
                Tu Carrito
            </h1>
            <p className="mt-3 text-gray-600">
                Revisa los productos a comprar.
            </p>
            <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500">
                    El carrito esta vacio
                </p>
            </div>
        </main>
    )
}

export default Cart