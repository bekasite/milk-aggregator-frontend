'use client'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import api, { getCurrentUser }  from '../../../utils/api'
import { toast } from 'react-toastify'

export default function AdminDelivery() {
  const [deliveryPersons, setDeliveryPersons] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    address: ''
  })
  const [activeTab, setActiveTab] = useState('delivery-team')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch delivery persons
      const deliveryResponse = await api.get('/delivery/personnel')
      setDeliveryPersons(deliveryResponse.data)
      
      // Fetch unassigned orders
      const ordersResponse = await api.get('/orders')
      const unassignedOrders = ordersResponse.data.filter(
        order => !order.assignedDeliveryId && order.status === 'Pending'
      )
      setOrders(unassignedOrders)
      
    } catch (error) {
      console.error('Error fetching delivery data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDelivery = async (e) => {
    e.preventDefault()
    
    try {
      await api.post('/auth/register', {
        ...formData,
        role: 'Delivery'
      })
      
      toast.success('Delivery person added successfully')
      setShowAddModal(false)
      setFormData({
        username: '',
        password: '',
        phone: '',
        address: ''
      })
      fetchData()
      
    } catch (error) {
      console.error('Add delivery error:', error)
      toast.error(error.response?.data?.error || 'Failed to add delivery person')
    }
  }

  const assignOrder = async (orderId, deliveryId) => {
    try {
      await api.put(`/orders/${orderId}/assign`, { deliveryId })
      toast.success('Order assigned successfully')
      fetchData()
    } catch (error) {
      console.error('Assign error:', error)
      toast.error('Failed to assign order')
    }
  }

  const updateDeliveryStatus = async (deliveryId, isActive) => {
    try {
      await api.put(`/auth/users/${deliveryId}`, { isActive })
      toast.success(`Delivery person ${isActive ? 'activated' : 'deactivated'}`)
      fetchData()
    } catch (error) {
      console.error('Update status error:', error)
      toast.error('Failed to update status')
    }
  }

  const calculateEfficiency = (person) => {
    const total = person.stats?.totalOrders || 0
    const completed = person.stats?.completedOrders || 0
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  return (
    <Layout role="Admin">
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Delivery Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your delivery team and order assignments</p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 hover:shadow-xl transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Delivery Person
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Delivery Team</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-900">{deliveryPersons.length}</h3>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-10a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-green-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>{deliveryPersons.filter(p => p.isActive).length} active</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Unassigned Orders</p>
                <h3 className="text-3xl font-bold mt-2 text-amber-600">{orders.length}</h3>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setActiveTab('unassigned-orders')}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Assign now →
              </button>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Today's Deliveries</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-900">
                  {deliveryPersons.reduce((sum, person) => sum + (person.stats?.todayDeliveries || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">Across all delivery persons</div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Earnings</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-900">
                  ${deliveryPersons.reduce((sum, person) => sum + (person.stats?.totalEarnings || 0), 0).toFixed(2)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">From completed deliveries</div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
          {[
            { id: 'delivery-team', label: 'Delivery Team', icon: '👥', count: deliveryPersons.length },
            { id: 'unassigned-orders', label: 'Unassigned Orders', icon: '📦', count: orders.length },
            { id: 'performance', label: 'Performance', icon: '📊', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Delivery Team */}
          {activeTab === 'delivery-team' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Delivery Team Members</h2>
                <p className="text-gray-600 text-sm mt-1">Manage your delivery personnel</p>
              </div>
              
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading delivery team...</p>
                </div>
              ) : deliveryPersons.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-10a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-gray-500">No delivery persons added yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                  >
                    Add First Delivery Person
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {deliveryPersons.map(person => (
                    <div key={person._id} className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center">
                            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                              <span className="text-xl font-bold text-white">
                                {person.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{person.username}</h3>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {person.phone}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => updateDeliveryStatus(person._id, !person.isActive)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${
                              person.isActive
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {person.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        {/* Address */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                          <div className="flex items-start text-sm text-gray-700">
                            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{person.address}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-3 mb-6">
                          <div className="text-center p-3 bg-blue-50/50 rounded-xl">
                            <div className="text-2xl font-bold text-gray-900">{person.stats?.totalOrders || 0}</div>
                            <div className="text-xs text-gray-600 mt-1">Total</div>
                          </div>
                          <div className="text-center p-3 bg-green-50/50 rounded-xl">
                            <div className="text-2xl font-bold text-green-600">{person.stats?.completedOrders || 0}</div>
                            <div className="text-xs text-gray-600 mt-1">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-amber-50/50 rounded-xl">
                            <div className="text-2xl font-bold text-amber-600">{person.stats?.pendingOrders || 0}</div>
                            <div className="text-xs text-gray-600 mt-1">Pending</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50/50 rounded-xl">
                            <div className="text-2xl font-bold text-gray-900">{calculateEfficiency(person)}%</div>
                            <div className="text-xs text-gray-600 mt-1">Efficiency</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              toast.info(`Performance Stats for ${person.username}:\n\nTotal Orders: ${person.stats?.totalOrders || 0}\nCompleted: ${person.stats?.completedOrders || 0}\nPending: ${person.stats?.pendingOrders || 0}\nTotal Earnings: $${(person.stats?.totalEarnings || 0).toFixed(2)}\nEfficiency: ${calculateEfficiency(person)}%`)
                            }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Stats
                          </button>
                        </div>

                        {/* Earnings */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Total Earnings</div>
                            <div className="text-lg font-bold text-gray-900">
                              ${(person.stats?.totalEarnings || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unassigned Orders */}
          {activeTab === 'unassigned-orders' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Unassigned Orders</h2>
                    <p className="text-gray-600 text-sm mt-1">Assign pending orders to delivery persons</p>
                  </div>
                  <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="mt-4 text-gray-500">All orders are assigned!</p>
                  <p className="text-gray-400 text-sm mt-1">No unassigned orders at the moment</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Order Details</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Customer</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Location</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Assign To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map(order => (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition-colors duration-200">
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{order.orderNumber}</div>
                            <div className="text-sm text-gray-600">
                              {order.items?.length || 0} items
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">
                                  {order.customerId?.username?.charAt(0) || 'C'}
                                </span>
                              </div>
                              <span className="font-medium">{order.customerId?.username || 'Customer'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-700 truncate max-w-xs">
                              {order.deliveryLocation || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">${order.totalPrice.toFixed(2)}</div>
                          </td>
                          <td className="p-4">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignOrder(order._id, e.target.value)
                                }
                              }}
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 text-sm"
                              defaultValue=""
                            >
                              <option value="" disabled>Select delivery person</option>
                              {deliveryPersons
                                .filter(person => person.isActive)
                                .map(person => (
                                  <option key={person._id} value={person._id}>
                                    {person.username}
                                  </option>
                                ))
                              }
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Delivery Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Add New Delivery Person</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({
                        username: '',
                        password: '',
                        phone: '',
                        address: ''
                      })
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-1">Add a new member to your delivery team</p>
              </div>
              
              <form onSubmit={handleAddDelivery} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                    required
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                    required
                    placeholder="Enter password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                    required
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 resize-none"
                    required
                    placeholder="Enter address"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({
                        username: '',
                        password: '',
                        phone: '',
                        address: ''
                      })
                    }}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Add Delivery Person
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}