function Cart (){
    return (
        <main className="mx-auto max-w-7x1 px-6 py-12">
            <h1 className="text-4x1 font-bold text-slate-900">
                Tu Carrito
            </h1>
            <p className="mt-3 text-gray-600">
                Revisa los productos a comprar.
            </p>
            <div className="mt-10 rounded-x1 border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500">
                    El carrito esta vacio
                </p>
            </div>
        </main>
    )
}

export default Cart