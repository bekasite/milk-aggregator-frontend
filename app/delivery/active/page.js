'use client'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import api from '../../../utils/api'
import { toast } from 'react-toastify'

export default function ActiveDeliveries() {
  const [activeOrders, setActiveOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveOrders()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveOrders = async () => {
    try {
      const response = await api.get('/orders/delivery')
      const active = response.data.filter(order => 
        order.status !== 'Delivered' && order.status !== 'Cancelled'
      )
      setActiveOrders(active)
    } catch (error) {
      console.error('Error fetching active orders:', error)
      toast.error('Failed to load active deliveries')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      toast.success(`Order status updated to ${status}`)
      fetchActiveOrders()
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update status')
    }
  }

  return (
    <Layout role="Delivery">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Active Deliveries</h1>
          <p className="text-gray-600">Manage your current delivery assignments</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto"></div>
            <p>Loading active deliveries...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-lg">No active deliveries assigned</p>
            <p className="text-gray-600 mt-2">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                    <p className="text-gray-600">Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Details</h4>
                    <div className="text-sm">
                      <p><strong>Name:</strong> {order.customerId?.username}</p>
                      <p><strong>Phone:</strong> {order.customerId?.phone}</p>
                      <p><strong>Address:</strong> {order.deliveryLocation}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <div className="text-sm">
                      <p><strong>Items:</strong> {order.items.length}</p>
                      <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
                      <p><strong>Payment:</strong> {order.paymentMethod}</p>
                      {order.deliveryInstructions && (
                        <p><strong>Instructions:</strong> {order.deliveryInstructions}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryLocation)}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Get Directions
                    </button>
                    
                    <button
                      onClick={() => window.location.href = `tel:${order.customerId?.phone}`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Call Customer
                    </button>

                    {order.status === 'Processing' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Shipped')}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Start Delivery
                      </button>
                    )}

                    {order.status === 'Shipped' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'Delivered')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}