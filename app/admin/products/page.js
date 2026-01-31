'use client'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import api from '../../../utils/api'
import { toast } from 'react-toastify'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Milk',
    stockCount: '',
    imageUrl: ''
  })

  useEffect(() => {
    fetchProducts()
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stockCount: parseInt(formData.stockCount)
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData)
        toast.success('Product updated successfully')
      } else {
        await api.post('/products', productData)
        toast.success('Product added successfully')
      }

      setShowAddModal(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Milk',
        stockCount: '',
        imageUrl: ''
      })
      
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error.response?.data?.error || 'Failed to save product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      stockCount: product.stockCount.toString(),
      imageUrl: product.imageUrl || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${productId}`)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const updateStock = async (productId, newStock) => {
    try {
      await api.patch(`/products/${productId}/stock`, { stockCount: newStock })
      toast.success('Stock updated successfully')
      fetchProducts()
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Failed to update stock')
    }
  }

  return (
    <Layout role="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add New Product
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto"></div>
                <p className="mt-4">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No products found. Add your first product!
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
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
                  {products.map(product => (
                    <tr key={product._id}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        {product.category}
                      </td>
                      <td className="px-6 py-4">
                        ${product.price}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span>{product.stockCount}</span>
                          <button
                            onClick={() => {
                              const newStock = prompt('Enter new stock count:', product.stockCount)
                              if (newStock && !isNaN(newStock)) {
                                updateStock(product._id, parseInt(newStock))
                              }
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.isActive
                            ? product.stockCount > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive
                            ? product.stockCount > 0
                              ? 'In Stock'
                              : 'Out of Stock'
                            : 'Inactive'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Count</label>
                    <input
                      type="number"
                      name="stockCount"
                      value={formData.stockCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="Milk">Milk</option>
                    <option value="Cheese">Cheese</option>
                    <option value="Yogurt">Yogurt</option>
                    <option value="Butter">Butter</option>
                    <option value="Cream">Cream</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingProduct(null)
                      setFormData({
                        name: '',
                        description: '',
                        price: '',
                        category: 'Milk',
                        stockCount: '',
                        imageUrl: ''
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingProduct ? 'Update' : 'Add'} Product
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