'use client'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../utils/api'
import { toast } from 'react-toastify'

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchDeliveryData(userData._id)
    }
  }, [])

  const fetchDeliveryData = async (deliveryId) => {
    try {
      setLoading(true)
      
      // Fetch active orders
      const ordersResponse = await api.get('/orders/delivery', {
        params: { status: 'all' }
      })
      setOrders(ordersResponse.data)

      // Fetch delivery stats
      const statsResponse = await api.get(`/delivery/stats/${deliveryId}`)
      setStats(statsResponse.data)

    } catch (error) {
      console.error('Error fetching delivery data:', error)
      toast.error('Failed to load delivery data')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}`)
      
      // Refresh data
      if (user) {
        fetchDeliveryData(user._id)
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error(error.response?.data?.error || 'Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const activeOrders = orders.filter(order => 
    order.status !== 'Delivered' && order.status !== 'Cancelled'
  )

  return (
    <Layout role="Delivery">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
          <p className="text-gray-600">Manage your deliveries</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{stats.summary?.totalAssigned || 0}</div>
              <div className="text-gray-600">Total Assigned</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                {stats.summary?.totalDelivered || 0}
              </div>
              <div className="text-gray-600">Delivered</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">
                ${stats.summary?.totalEarnings?.toFixed(2) || '0.00'}
              </div>
              <div className="text-gray-600">Total Earnings</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">
                {activeOrders.length}
              </div>
              <div className="text-gray-600">Active Deliveries</div>
            </div>
          </div>
        )}

        {/* Active Deliveries */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Active Deliveries ({activeOrders.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-4">Loading deliveries...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No active deliveries assigned
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeOrders.map(order => (
                    <tr key={order._id}>
                      <td className="px-6 py-4">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.customerId?.username}</div>
                        <div className="text-sm text-gray-500">{order.customerId?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {order.deliveryLocation}
                        {order.deliveryInstructions && (
                          <div className="text-xs text-gray-500">
                            Note: {order.deliveryInstructions}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {order.items.length} items
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: ${order.totalPrice}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {order.status === 'Processing' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Shipped')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Start Delivery
                          </button>
                        )}
                        
                        {order.status === 'Shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Delivered')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Mark Delivered
                          </button>
                        )}

                        <button
                          onClick={() => {
                            // Open map with directions
                            const address = encodeURIComponent(order.deliveryLocation)
                            window.open(`https://maps.google.com/?q=${address}`, '_blank')
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Directions
                        </button>

                        <button
                          onClick={() => {
                            // Call customer
                            const phone = order.customerId?.phone
                            if (phone) {
                              window.location.href = `tel:${phone}`
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Call Customer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delivery History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Recent Completed Deliveries</h2>
          </div>
          <div className="p-4">
            {orders.filter(o => o.status === 'Delivered').slice(0, 5).map(order => (
              <div key={order._id} className="flex justify-between items-center py-3 border-b last:border-0">
                <div>
                  <div className="font-medium">{order.orderNumber}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.updatedAt).toLocaleDateString()} • {order.deliveryLocation}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${order.totalPrice}</div>
                  <div className="text-sm text-gray-500">
                    Earned: ${(order.totalPrice * 0.1).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}