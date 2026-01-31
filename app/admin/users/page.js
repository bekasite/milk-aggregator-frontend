'use client'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import api from '../../../utils/api'
import { toast } from 'react-toastify'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/auth/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId, isActive) => {
    try {
      await api.put(`/auth/users/${userId}`, { isActive })
      toast.success(`User ${isActive ? 'activated' : 'deactivated'}`)
      fetchUsers()
    } catch (error) {
      console.error('Update user error:', error)
      toast.error('Failed to update user')
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}`, { role: newRole })
      toast.success('User role updated')
      fetchUsers()
    } catch (error) {
      console.error('Update role error:', error)
      toast.error('Failed to update role')
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    const form = e.target
    
    try {
      const updatedData = {
        phone: form.phone.value,
        address: form.address.value,
        email: form.email.value
      }
      
      await api.put(`/auth/users/${editingUser._id}`, updatedData)
      toast.success('User updated successfully')
      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Edit user error:', error)
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      await api.delete(`/auth/users/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers()
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error('Failed to delete user')
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      'Admin': 'bg-gradient-to-r from-red-500 to-pink-500',
      'Delivery': 'bg-gradient-to-r from-blue-500 to-indigo-500',
      'Customer': 'bg-gradient-to-r from-green-500 to-emerald-500'
    }
    return colors[role] || 'bg-gradient-to-r from-gray-500 to-gray-600'
  }

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' 
      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border-gray-200'
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const getInitials = (username) => {
    return username.charAt(0).toUpperCase()
  }

  const getRandomColor = (username) => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-indigo-500',
      'bg-gradient-to-r from-purple-500 to-pink-500',
      'bg-gradient-to-r from-green-500 to-teal-500',
      'bg-gradient-to-r from-amber-500 to-orange-500',
      'bg-gradient-to-r from-rose-500 to-pink-500'
    ]
    const index = username.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Layout role="Admin">
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage all system users and their permissions</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchUsers}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-white hover:border-gray-300 hover:shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Delivery">Delivery</option>
                <option value="Customer">Customer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <div className="flex space-x-2">
                {[
                  { value: 'all', label: 'All', bg: 'bg-gray-100' },
                  { value: 'active', label: 'Active', bg: 'bg-green-100' },
                  { value: 'inactive', label: 'Inactive', bg: 'bg-gray-100' }
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      statusFilter === status.value
                        ? `${status.bg} text-gray-900 ring-2 ring-gray-300`
                        : 'bg-white/80 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">Active Users</div>
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.isActive).length}
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
              <div className="text-sm text-gray-600">Admins</div>
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'Admin').length}
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid/Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-10a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              <p className="mt-4 text-gray-500">No users found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">User Profile</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Contact Info</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Joined</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 ${getRandomColor(user.username)} rounded-full flex items-center justify-center mr-3`}>
                            <span className="text-white font-bold text-lg">
                              {getInitials(user.username)}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{user.username}</div>
                            {user.email && (
                              <div className="text-sm text-gray-600">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user._id, e.target.value)}
                          className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg ${getRoleColor(user.role)} border-0 outline-none cursor-pointer transition-all duration-300 hover:opacity-90`}
                        >
                          <option value="Customer">Customer</option>
                          <option value="Delivery">Delivery</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      
                      <td className="p-4">
                        <div className="space-y-1">
                          {user.phone && (
                            <div className="flex items-center text-sm text-gray-700">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {user.phone}
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-start text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate max-w-xs">{user.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <button
                          onClick={() => updateUserStatus(user._id, !user.isActive)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${getStatusColor(user.isActive)} transition-all duration-300 hover:shadow-sm`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(user)
                              setShowEditModal(true)
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Edit user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingUser(null)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm mt-1">{editingUser.username}</p>
              </div>
              
              <form onSubmit={handleEditUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingUser.phone}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email || ''}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300"
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    defaultValue={editingUser.address || ''}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all duration-300 resize-none"
                    placeholder="Optional"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingUser(null)
                    }}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Update User
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