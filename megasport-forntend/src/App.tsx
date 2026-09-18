import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Category from './pages/Category'
import NotFound from './pages/NotFound'
import Cart from './pages/Cart'
import Footer from './components/Footer'
import ProductDetail from './pages/ProductDetail'


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
