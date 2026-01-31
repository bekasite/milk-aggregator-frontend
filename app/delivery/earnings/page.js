'use client'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import api from '../../../utils/api'
import { toast } from 'react-toastify'

export default function DeliveryEarnings() {
  const [earnings, setEarnings] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchEarnings(userData._id)
    }
  }, [period])

  const fetchEarnings = async (deliveryId) => {
    try {
      setLoading(true)
      const response = await api.get(`/delivery/${deliveryId}/earnings`, {
        params: { period }
      })
      setEarnings(response.data.earnings)
      setSummary(response.data.summary)
    } catch (error) {
      console.error('Error fetching earnings:', error)
      toast.error('Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  const exportEarnings = () => {
    const csvContent = [
      ['Date', 'Orders', 'Earnings', 'Total Revenue'],
      ...earnings.map(day => [
        day._id,
        day.orderCount,
        `$${day.earnings.toFixed(2)}`,
        `$${day.totalRevenue.toFixed(2)}`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `earnings-${period}.csv`
    a.click()
  }

  return (
    <Layout role="Delivery">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Earnings</h1>
            <p className="text-gray-600">Track your delivery earnings</p>
          </div>
          <div className="flex space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={exportEarnings}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold text-green-600">
                ${summary.totalEarnings?.toFixed(2) || '0.00'}
              </div>
              <div className="text-gray-600">Total Earnings</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">
                {summary.totalOrders || 0}
              </div>
              <div className="text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl font-bold">
                ${summary.averageEarningsPerOrder || '0.00'}
              </div>
              <div className="text-gray-600">Average per Order</div>
            </div>
          </div>
        )}

        {/* Earnings Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Earnings Breakdown</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-4">Loading earnings data...</p>
            </div>
          ) : earnings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No earnings data for selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders Delivered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Earnings (10%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {earnings.map((day) => (
                    <tr key={day._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {day._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {day.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${day.totalRevenue?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-green-600">
                          ${day.earnings?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commission Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-blue-800 mb-2">Commission Structure</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• You earn 10% commission on every delivered order</li>
            <li>• Earnings are calculated based on order total amount</li>
            <li>• Payments are processed weekly</li>
            <li>• Contact admin for any earnings-related queries</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}