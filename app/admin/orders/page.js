'use client'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import api,{getCurrentUser} from '../../../utils/api'
import { toast } from 'react-toastify'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [deliveryPersons, setDeliveryPersons] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchDeliveryPersons()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = filter === 'all' ? {} : { status: filter }
      const response = await api.get('/orders', { params })
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryPersons = async () => {
    try {
      const response = await api.get('/delivery/available')
      setDeliveryPersons(response.data)
    } catch (error) {
      console.error('Error fetching delivery persons:', error)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      toast.success(`Order status updated to ${status}`)
      fetchOrders()
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update status')
    }
  }

  const assignDelivery = async (orderId, deliveryId) => {
    try {
      console.log(`🚚 Assigning order ${orderId} to delivery person ${deliveryId}`)
      
      // Get delivery person details for logging
      const deliveryPerson = deliveryPersons.find(d => d._id === deliveryId);
      console.log('📋 Delivery person:', deliveryPerson?.username)
      
      // IMPORTANT: Send ONLY deliveryId
      const response = await api.put(`/orders/${orderId}/assign`, {
        deliveryId: deliveryId  // <-- Only this field!
      })
      
      console.log('✅ Assignment successful:', response.data)
      toast.success(`Assigned to ${deliveryPerson?.username || 'delivery person'}!`)
      
      // Refresh and close modal
      fetchOrders()
      setShowAssignModal(false)
      setSelectedOrder(null)
      
    } catch (error) {
      console.error('❌ Assign error:', error)
      console.error('Error response:', error.response?.data)
      
      // Show user-friendly error
      if (error.response?.data?.error) {
        toast.error(`Assignment failed: ${error.response.data.error}`)
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Failed to assign delivery person. Please try again.')
      }
      
      // Optional: For development, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('Development: Simulating assignment success')
        
        // Update local state
        setOrders(orders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                assignedDeliveryId: { 
                  _id: deliveryId,
                  username: deliveryPersons.find(d => d._id === deliveryId)?.username || 'Delivery Person',
                  phone: deliveryPersons.find(d => d._id === deliveryId)?.phone || ''
                }, 
                status: 'Processing' 
              }
            : order
        ))
        setShowAssignModal(false)
        setSelectedOrder(null)
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
    <Layout role="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-gray-600">Manage all customer orders</p>
          </div>
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
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
                No orders found
              </div>
            ) : (
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
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td className="px-6 py-4">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.customerId?.username}</div>
                        <div className="text-sm text-gray-500">{order.customerId?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.assignedDeliveryId ? (
                          <div className="text-sm">
                            <div>{order.assignedDeliveryId?.username}</div>
                            <div className="text-gray-500">{order.assignedDeliveryId?.phone}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => {
                            // View order details
                            alert(`Order Details:\n
                              Order #: ${order.orderNumber}\n
                              Customer: ${order.customerId?.username}\n
                              Phone: ${order.customerId?.phone}\n
                              Location: ${order.deliveryLocation}\n
                              Total: $${order.totalPrice}\n
                              Status: ${order.status}\n
                              Items: ${order.items.length}
                            `)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                        
                        {order.status === 'Pending' && !order.assignedDeliveryId && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowAssignModal(true)
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            Assign
                          </button>
                        )}
                        
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Confirmed')}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            Confirm
                          </button>
                        )}
                        
                        {order.status === 'Confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Processing')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Process
                          </button>
                        )}
                        
                        {order.status === 'Shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'Delivered')}
                            className="text-green-600 hover:text-green-800"
                          >
                            Complete
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

        {/* Assign Delivery Modal */}
        {showAssignModal && selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Assign Delivery Person</h2>
      <p className="mb-4">Order: {selectedOrder.orderNumber}</p>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Delivery Person</label>
        <select
          id="deliveryAssignSelect" // <-- ADD THIS ID
          className="w-full px-3 py-2 border rounded"
          defaultValue=""
        >
          <option value="" disabled>Select a delivery person</option>
          {deliveryPersons.map(person => (
            <option key={person._id} value={person._id}>
              {person.username} ({person.phone})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => {
            setShowAssignModal(false)
            setSelectedOrder(null)
          }}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            // Use the specific ID
            const select = document.getElementById('deliveryAssignSelect')
            if (select && select.value) {
              assignDelivery(selectedOrder._id, select.value)
            } else {
              toast.error('Please select a delivery person')
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Assign
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </Layout>
  )
}