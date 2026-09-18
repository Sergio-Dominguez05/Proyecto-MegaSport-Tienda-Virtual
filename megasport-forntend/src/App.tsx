import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Category from './pages/Category'
import NotFound from './pages/NotFound'
import Cart from './pages/Cart'


function App() {
  return(
    <>
    <Navbar />
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
        path="*"
        element={<NotFound />}
      />

    </Routes>
    </>
  )
}

export default App
