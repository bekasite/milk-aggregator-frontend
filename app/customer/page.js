'use client'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import { toast } from 'react-toastify'
import Link from 'next/link'

export default function CustomerDashboard() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    fetchProducts()
    loadCart()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product._id)
    let newCart

    if (existingItem) {
      newCart = cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      newCart = [...cart, {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        imageUrl: product.imageUrl,
        category: product.category
      }]
    }

    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    toast.success(`🛒 ${product.name} added to cart!`)
  }

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.productId !== productId)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    toast.info('Item removed from cart')
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    const newCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    )
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ['all', ...categories]
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch(sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'name':
        return a.name.localeCompare(b.name)
      case 'stock':
        return b.stockCount - a.stockCount
      default:
        return 0
    }
  })

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalCartValue = () => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
  }

  return (
    <Layout role="Customer">
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dairy Shop
            </h1>
            <p className="text-gray-600 mt-1">Fresh dairy products delivered to your doorstep</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Cart Summary */}
            <Link
              href="/customer/cart"
              className="relative px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Cart</span>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {getTotalCartItems()}
              </span>
            </Link>
            
            {/* Orders Button */}
            <Link
              href="/customer/orders"
              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>My Orders</span>
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 appearance-none"
              >
                <option value="all">All Categories</option>
                {getCategories().slice(1).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 appearance-none"
              >
                <option value="default">Sort by</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
                <option value="stock">Stock Available</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">Total Products</div>
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">In Stock</div>
              <div className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.stockCount > 0).length}
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">Cart Items</div>
              <div className="text-2xl font-bold text-gray-900">{getTotalCartItems()}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">Cart Value</div>
              <div className="text-2xl font-bold text-gray-900">${getTotalCartValue().toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-between items-center">
          <div className="text-gray-600">
            Showing <span className="font-bold">{sortedProducts.length}</span> products
            {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fresh products...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="mt-4 text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSearchTerm('')
              }}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map(product => (
              <div key={product._id} className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      product.stockCount > 10
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : product.stockCount > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {product.stockCount > 0 
                        ? `${product.stockCount} in stock` 
                        : 'Out of stock'}
                    </span>
                  </div>
                  {/* Category Badge */}
                  {product.category && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 text-xs font-medium bg-white/80 backdrop-blur-sm text-gray-700 rounded-full border border-white/20">
                        {product.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {product.description || 'No description available'}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${product.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        per unit
                      </div>
                    </div>
                    
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stockCount === 0}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                        product.stockCount === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add to Cart
                    </button>
                  </div>

                  {/* In Cart Indicator */}
                  {cart.find(item => item.productId === product._id) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-medium">
                          ✓ In cart ({cart.find(item => item.productId === product._id).quantity})
                        </span>
                        <button
                          onClick={() => removeFromCart(product._id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {sortedProducts.map(product => (
              <div key={product._id} className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Product Image */}
                  <div className="md:w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex-shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                              {product.name}
                            </h3>
                            {product.category && (
                              <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mt-2">
                                {product.category}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              ${product.price}
                            </div>
                            <div className="text-sm text-gray-500">
                              per unit
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-3">
                          {product.description || 'No description available'}
                        </p>
                        
                        {/* Stock Status */}
                        <div className="mt-4">
                          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                            product.stockCount > 10
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : product.stockCount > 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {product.stockCount > 0 
                              ? `${product.stockCount} units available` 
                              : 'Currently out of stock'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stockCount === 0}
                          className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                            product.stockCount === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add to Cart
                        </button>
                        
                        {cart.find(item => item.productId === product._id) && (
                          <div className="text-center text-sm text-green-600 font-medium">
                            ✓ Added ({cart.find(item => item.productId === product._id).quantity})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Link
              href="/customer/cart"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalCartItems()}
                </span>
              </div>
              <div>
                <div className="font-bold">${getTotalCartValue().toFixed(2)}</div>
                <div className="text-sm opacity-90">View Cart & Checkout</div>
              </div>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}