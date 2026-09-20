import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Category from './pages/Category'
import NotFound from './pages/NotFound'
import Cart from './pages/Cart'
import Footer from './components/Footer'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import CourierSelection from './pages/CourierSelection'
import Payment from './pages/Payment'
import OrderConfirmation from './pages/OrderConfirmation'


function App() {
  return(
    <div className="flex min-h-screen flex-col">

      <Navbar />
        <div className='flex-1'>
          <Routes>

            <Route 
              path="/"
              element={<Home />}
            />
            <Route 
              path="/categoria/:category"
              element={<Category />} 
            />

            <Route 
              path="/carrito"
              element={<Cart />}
            />

            <Route
              path="/producto/:id"
              element={<ProductDetail />} 
            />
            <Route 
              path="/checkout"
              element={<Checkout />}
            />
            <Route 
              path="/checkout/courier"
              element={<CourierSelection />}
            />
            <Route 
              path="/checkout/pago"
              element={<Payment />}
            />

            <Route 
              path='/orden/:id'
              element={<OrderConfirmation />}
            />

            <Route 
              path="*"
              element={<NotFound />}
            />

          </Routes>
        </div>

        <Footer />
    </div>
  )
}

export default App
