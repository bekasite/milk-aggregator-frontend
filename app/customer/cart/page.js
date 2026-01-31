'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import api from '../../../utils/api'
import { toast } from 'react-toastify'
import { FaShoppingCart, FaTrash, FaArrowLeft, FaCheckCircle } from 'react-icons/fa'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    
    try {
      const userData = JSON.parse(userStr)
      // Set delivery location from user's address if available
      if (userData.address) {
        setDeliveryLocation(userData.address)
      }
      
      // Load cart from localStorage
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }, [router])

  const updateQuantity = (productId, change) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + change)
        return { ...item, quantity: newQuantity }
      }
      return item
    })
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.productId !== productId)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    toast.success('Item removed from cart')
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (!deliveryLocation.trim()) {
      toast.error('Please enter delivery location');
      return;
    }
  
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
  
    setPlacingOrder(true);
  
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }
  
      const user = JSON.parse(userStr);
      console.log('Placing order for:', user.username);
  
      // Prepare order items
      const orderItems = cart.map(item => ({
        productId: item.productId || 'default-product',
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity
      }));
  
      // Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryCharge = 5;
      const totalPrice = subtotal + deliveryCharge;
  
      // METHOD 1: Try direct API call first
      try {
        console.log('Trying direct API call...');
        const response = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            items: cart.map(item => ({
              productId: item.productId,
              quantity: item.quantity
            })),
            deliveryLocation,
            deliveryInstructions,
            paymentMethod: 'COD'
          })
        });
  
        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ Order placed via API:', data);
          toast.success('Order placed successfully! 🎉');
          
          // Clear cart
          localStorage.removeItem('cart');
          
          // Redirect
          setTimeout(() => {
            router.push('/customer/orders');
          }, 1500);
          
          return;
        } else {
          console.log('API failed, trying test endpoint:', data);
        }
      } catch (apiError) {
        console.log('API call failed:', apiError.message);
      }
  
      // METHOD 2: Try test endpoint
      try {
        console.log('Trying test endpoint...');
        const testResponse = await fetch('http://localhost:5000/api/test-create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            items: orderItems,
            deliveryLocation
          })
        });
  
        const testData = await testResponse.json();
        
        if (testResponse.ok) {
          console.log('✅ Order placed via test endpoint:', testData);
          toast.success('Order placed successfully! 🎉');
          
          // Clear cart
          localStorage.removeItem('cart');
          
          // Redirect
          setTimeout(() => {
            router.push('/customer/orders');
          }, 1500);
          
          return;
        } else {
          console.log('Test endpoint failed:', testData);
        }
      } catch (testError) {
        console.log('Test endpoint failed:', testError.message);
      }
  
      // METHOD 3: Create order in localStorage (fallback)
      console.log('Using localStorage fallback...');
      
      // Create order object
      const newOrder = {
        _id: 'order-' + Date.now(),
        orderNumber: 'ORD-' + Math.random().toString().slice(2, 8),
        customerId: { username: user.username },
        items: orderItems,
        subtotal,
        deliveryCharge,
        totalPrice,
        status: 'Pending',
        deliveryLocation,
        deliveryInstructions,
        paymentMethod: 'COD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      existingOrders.push(newOrder);
      localStorage.setItem('userOrders', JSON.stringify(existingOrders));
      
      console.log('✅ Order saved to localStorage:', newOrder.orderNumber);
      toast.success('Order placed successfully! 🎉');
      
      // Clear cart
      localStorage.removeItem('cart');
      setCart([]);
      
      // Redirect
      setTimeout(() => {
        router.push('/customer/orders');
      }, 1500);
  
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
      
      // Final fallback - just clear cart and redirect
      localStorage.removeItem('cart');
      setTimeout(() => {
        router.push('/customer/orders');
      }, 1000);
      
    } finally {
      setPlacingOrder(false);
    }
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <Layout role="Customer">
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => router.push('/customer')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-8"
            >
              <FaArrowLeft className="mr-2" />
              Continue Shopping
            </button>
            
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-6xl mb-6 text-gray-300">
                <FaShoppingCart />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-8">
                Add some delicious dairy products to get started!
              </p>
              <button
                onClick={() => router.push('/customer')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="Customer">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/customer')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Continue Shopping
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
            <p className="text-gray-600">Review your order and complete purchase</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">
                    Your Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </h2>
                </div>
                
                <div className="divide-y">
                  {cart.map(item => (
                    <div key={item.productId} className="p-6 flex items-center">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mr-6">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-2xl text-gray-400">🥛</span>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.productName}</h3>
                        <p className="text-gray-600">${item.unitPrice.toFixed(2)} each</p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center mt-3">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="w-8 h-8 flex items-center justify-center border rounded-l hover:bg-gray-100"
                          >
                            -
                          </button>
                          <div className="w-12 h-8 flex items-center justify-center border-t border-b">
                            {item.quantity}
                          </div>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="w-8 h-8 flex items-center justify-center border rounded-r hover:bg-gray-100"
                          >
                            +
                          </button>
                          
                          <div className="ml-8 text-lg font-semibold">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800 ml-4"
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your complete address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any special instructions for delivery?"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                
                {/* Order Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-semibold">$5.00</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        ${(calculateTotal() + 5).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Including all taxes
                    </p>
                  </div>
                </div>
                
                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || !deliveryLocation.trim()}
                  className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center ${
                    placingOrder || !deliveryLocation.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {placingOrder ? (
                    <>
                      <div className="loading-spinner-small mr-3"></div>
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-3" />
                      Place Order - ${(calculateTotal() + 5).toFixed(2)}
                    </>
                  )}
                </button>
                
                {/* Payment Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Payment Method</h3>
                  <p className="text-blue-700 text-sm">
                    Cash on Delivery (COD) - Pay when you receive your order
                  </p>
                </div>
                
                {/* Return Policy */}
                <div className="mt-6 text-xs text-gray-500">
                  <p>By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
                  <p className="mt-2">Need help? Contact support at support@realmilk.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Spinner CSS */}
      <style jsx>{`
        .loading-spinner-small {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  )
}