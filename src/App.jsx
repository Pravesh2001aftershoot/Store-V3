import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Packages from './pages/Packages'
import PackageDetail from './pages/PackageDetail'
import Builder from './pages/Builder'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:categoryId" element={<Shop />} />
        <Route path="product/:productId" element={<Product />} />
        <Route path="packages" element={<Packages />} />
        <Route path="packages/:packageId" element={<PackageDetail />} />
        <Route path="cart" element={<Cart />} />
      </Route>
      <Route path="build/:kind/:id" element={<Builder />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="payment" element={<Payment />} />
    </Routes>
  )
}
