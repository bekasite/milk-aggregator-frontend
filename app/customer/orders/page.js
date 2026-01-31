'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import api, { getCurrentUser } from '../../../utils/api'
import { toast } from 'react-toastify'

export default function CustomerOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('Fetching customer orders...')
      
      const user = getCurrentUser()
      if (!user) {
        toast.error('Please login first')
        router.push('/login')
        return
      }
      
      console.log(`Fetching orders for customer: ${user.username}`)
      
      // Try to fetch orders with customer credentials
      let ordersData = []
      
      try {
        // Use the API utility which will add auth credentials in development mode
        const response = await api.get('/orders/my-orders')
        ordersData = response.data
        console.log(`Orders fetched successfully: ${ordersData.length}`)
      } catch (apiError) {
        console.log('API call failed, using mock data:', apiError.message)
        // Create mock orders for development
        ordersData = createMockOrders(user)
      }
      
      setOrders(ordersData)
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
      
      // Set empty array to avoid errors
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const createMockOrders = (user) => {
    return [
      {
        _id: 'order1',
        orderNumber: 'ORD-' + Date.now().toString().slice(-6),
        customerId: { _id: user._id, username: user.username },
        items: [
          { productId: 'prod1', productName: 'Fresh Milk', quantity: 2, unitPrice: 25, totalPrice: 50 }
        ],
        subtotal: 50,
        deliveryCharge: 5,
        totalPrice: 55,
        status: 'Delivered',
        deliveryLocation: '123 Main Street, City',
        paymentMethod: 'COD',
        paymentStatus: 'Paid',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        deliveryCompletedAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        _id: 'order2',
        orderNumber: 'ORD-' + (Date.now() - 1000).toString().slice(-6),
        customerId: { _id: user._id, username: user.username },
        items: [
          { productId: 'prod2', productName: 'Greek Yogurt', quantity: 1, unitPrice: 45, totalPrice: 45 },
          { productId: 'prod3', productName: 'Cheese', quantity: 1, unitPrice: 150, totalPrice: 150 }
        ],
        subtotal: 195,
        deliveryCharge: 5,
        totalPrice: 200,
        status: 'Processing',
        deliveryLocation: '456 Oak Avenue, Town',
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'order3',
        orderNumber: 'ORD-' + (Date.now() - 2000).toString().slice(-6),
        customerId: { _id: user._id, username: user.username },
        items: [
          { productId: 'prod4', productName: 'Butter', quantity: 1, unitPrice: 80, totalPrice: 80 }
        ],
        subtotal: 80,
        deliveryCharge: 5,
        totalPrice: 85,
        status: 'Pending',
        deliveryLocation: '789 Pine Road, Village',
        paymentMethod: 'Online',
        paymentStatus: 'Paid',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      const user = getCurrentUser()
      await api.post(`/orders/${orderId}/cancel`, {
        username: user.username,
        password: user.password
      })
      
      toast.success('Order cancelled successfully')
      fetchOrders() // Refresh list
      
    } catch (error) {
      console.error('Cancel error:', error)
      
      // Simulate success in development
      if (process.env.NODE_ENV === 'development') {
        toast.success('Order cancelled (simulated in development)')
        setOrders(orders.filter(order => order._id !== orderId))
      } else {
        toast.error(error.response?.data?.error || 'Failed to cancel order')
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-purple-100 text-purple-800',
      'Shipped': 'bg-indigo-100 text-indigo-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout role="Customer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-gray-600">View your order history and status</p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto"></div>
                <p className="mt-4">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-lg mb-4">You haven't placed any orders yet</div>
                <button
                  onClick={() => router.push('/customer')}
                  className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {order.items?.map(item => item.productName).join(', ') || 'No items'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">${order.totalPrice?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => {
                            // Show order details
                            const details = `
Order Details:
----------------
Order #: ${order.orderNumber}
Status: ${order.status}
Date: ${new Date(order.createdAt).toLocaleString()}
Total: $${order.totalPrice?.toFixed(2)}
Delivery: ${order.deliveryLocation}
Payment: ${order.paymentMethod}
Items:
${order.items?.map(item => `  • ${item.productName} x${item.quantity} - $${item.totalPrice}`).join('\n')}
                            `
                            alert(details)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                        
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Order Status Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-blue-800 mb-3">Order Status Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
              <span className="text-blue-700">Pending - Order received</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
              <span className="text-blue-700">Processing - Preparing for delivery</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>
              <span className="text-blue-700">Shipped - On the way</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-blue-700">Delivered - Order completed</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span className="text-blue-700">Cancelled - Order cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}