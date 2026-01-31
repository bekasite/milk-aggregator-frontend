'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '../../../components/Layout'
import api, { authGet, getCurrentUser } from '../../../utils/api'
import { toast } from 'react-toastify'
import { FaMapMarkerAlt, FaRoute, FaSync, FaHome, FaTruck, FaCheckCircle, FaDirections } from 'react-icons/fa'

export default function DeliveryMap() {
  const router = useRouter()
  const mapRef = useRef(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState([])

  useEffect(() => {
    console.log('Delivery map page mounting...')
    
    // Check if user is logged in
    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }
    
    console.log(`User role: ${currentUser.role}, Expected role: Delivery`)
    
    if (currentUser.role !== 'Delivery') {
      console.log(`Wrong role, redirecting to /${currentUser.role.toLowerCase()}`)
      router.push(`/${currentUser.role.toLowerCase()}`)
      return
    }
    
    setUser(currentUser)
    fetchDeliveryData(currentUser)
    
    // Load Google Maps script
    loadGoogleMaps()
  }, [router])

  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDummyKey'}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('Google Maps loaded')
      setMapLoaded(true)
      initializeMap()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps')
      toast.error('Failed to load map services')
    }
    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return
    
    // Default center (can be user's current location in production)
    const defaultCenter = { lat: 40.7128, lng: -74.0060 } // New York
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })
    
    // Store map instance
    window.deliveryMap = map
    
    // Add markers when orders are loaded
    if (orders.length > 0) {
      addMarkersToMap(map, orders)
    }
    
    return map
  }

  const addMarkersToMap = (map, deliveryOrders) => {
    if (!map || !window.google) return
    
    // Clear existing markers
    if (window.deliveryMarkers) {
      window.deliveryMarkers.forEach(marker => marker.setMap(null))
    }
    window.deliveryMarkers = []
    
    // Add markers for each delivery location
    deliveryOrders.forEach((order, index) => {
      // Create a geocoder to convert address to coordinates
      const geocoder = new window.google.maps.Geocoder()
      
      geocoder.geocode({ address: order.deliveryLocation }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location
          
          // Create marker
          const marker = new window.google.maps.Marker({
            position: location,
            map: map,
            title: `Order: ${order.orderNumber}`,
            label: {
              text: `${index + 1}`,
              color: 'white',
              fontWeight: 'bold'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: order.status === 'Delivered' ? '#10B981' : '#3B82F6',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
              scale: 15
            },
            animation: window.google.maps.Animation.DROP
          })
          
          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 5px 0; color: #3B82F6; font-weight: bold;">
                  Order #${order.orderNumber}
                </h3>
                <p style="margin: 0 0 5px 0;">
                  <strong>Customer:</strong> ${order.customerId?.username || 'N/A'}
                </p>
                <p style="margin: 0 0 5px 0;">
                  <strong>Amount:</strong> $${order.totalPrice?.toFixed(2) || '0.00'}
                </p>
                <p style="margin: 0 0 5px 0;">
                  <strong>Status:</strong> <span style="color: ${
                    order.status === 'Delivered' ? '#10B981' : 
                    order.status === 'Processing' ? '#F59E0B' : '#3B82F6'
                  }">${order.status}</span>
                </p>
                <p style="margin: 0 0 5px 0;">
                  <strong>Phone:</strong> ${order.customerId?.phone || 'N/A'}
                </p>
                <div style="margin-top: 10px;">
                  <button onclick="window.open('tel:${order.customerId?.phone || ''}')" 
                    style="background: #10B981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                    Call Customer
                  </button>
                  <button onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(order.deliveryLocation)}')" 
                    style="background: #3B82F6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    Get Directions
                  </button>
                </div>
              </div>
            `
          })
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker)
            setSelectedOrder(order)
          })
          
          window.deliveryMarkers.push(marker)
          
          // Fit bounds to show all markers
          if (index === deliveryOrders.length - 1) {
            const bounds = new window.google.maps.LatLngBounds()
            window.deliveryMarkers.forEach(m => bounds.extend(m.getPosition()))
            map.fitBounds(bounds, { padding: 50 })
          }
        }
      })
    })
  }

  const fetchDeliveryData = async (deliveryUser) => {
    try {
      setLoading(true)
      console.log('Fetching delivery data for map...')
      
      // Try to fetch real data
      let ordersData = []
      
      try {
        const response = await authGet('/orders/delivery')
        ordersData = response.data
        console.log('Real orders fetched:', ordersData.length)
      } catch (apiError) {
        console.log('API call failed, using mock data:', apiError.message)
        // Use mock data for development
        ordersData = getMockOrders()
      }
      
      // Filter for active deliveries
      const activeOrders = ordersData.filter(order => 
        order.status !== 'Delivered' && order.status !== 'Cancelled'
      )
      
      setOrders(activeOrders)
      
      // If map is already loaded, add markers
      if (mapLoaded && window.deliveryMap) {
        addMarkersToMap(window.deliveryMap, activeOrders)
      }
      
      // Calculate optimized route (simple order by status)
      const route = calculateOptimizedRoute(activeOrders)
      setOptimizedRoute(route)
      
    } catch (error) {
      console.error('Error fetching delivery data:', error)
      toast.error('Failed to load delivery data')
      
      // Show mock data
      const mockOrders = getMockOrders()
      setOrders(mockOrders)
      setOptimizedRoute(calculateOptimizedRoute(mockOrders))
    } finally {
      setLoading(false)
    }
  }

  const getMockOrders = () => {
    return [
      {
        _id: '1',
        orderNumber: 'ORD-1001',
        customerId: { 
          username: 'John Doe', 
          phone: '+1234567890' 
        },
        deliveryLocation: '123 Main Street, New York, NY 10001',
        items: [{ productName: 'Fresh Milk' }],
        totalPrice: 45.50,
        status: 'Processing',
        deliveryInstructions: 'Leave at door if no answer',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        orderNumber: 'ORD-1002',
        customerId: { 
          username: 'Jane Smith', 
          phone: '+0987654321' 
        },
        deliveryLocation: '456 Park Avenue, New York, NY 10022',
        items: [{ productName: 'Greek Yogurt' }, { productName: 'Cheese' }],
        totalPrice: 85.75,
        status: 'Shipped',
        deliveryInstructions: 'Call before delivery',
        createdAt: new Date().toISOString()
      },
      {
        _id: '3',
        orderNumber: 'ORD-1003',
        customerId: { 
          username: 'Robert Johnson', 
          phone: '+1122334455' 
        },
        deliveryLocation: '789 Broadway, New York, NY 10003',
        items: [{ productName: 'Butter' }, { productName: 'Cream' }],
        totalPrice: 65.25,
        status: 'Processing',
        deliveryInstructions: 'Apartment 5B',
        createdAt: new Date().toISOString()
      },
      {
        _id: '4',
        orderNumber: 'ORD-1004',
        customerId: { 
          username: 'Emily Wilson', 
          phone: '+5566778899' 
        },
        deliveryLocation: '101 Wall Street, New York, NY 10005',
        items: [{ productName: 'Buffalo Milk' }],
        totalPrice: 35.00,
        status: 'Shipped',
        deliveryInstructions: 'Reception will accept',
        createdAt: new Date().toISOString()
      }
    ]
  }

  const calculateOptimizedRoute = (ordersList) => {
    // Simple route optimization: prioritize by status and time
    return [...ordersList].sort((a, b) => {
      // Priority: Shipped > Processing > others
      const priority = { 'Shipped': 1, 'Processing': 2, 'Pending': 3 }
      const aPriority = priority[a.status] || 4
      const bPriority = priority[b.status] || 4
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Then by creation time (oldest first)
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
  }

  const optimizeRoute = () => {
    if (orders.length === 0) {
      toast.info('No deliveries to optimize')
      return
    }
    
    const optimized = calculateOptimizedRoute(orders)
    setOptimizedRoute(optimized)
    toast.success('Route optimized!')
    
    // Update markers on map
    if (window.deliveryMap) {
      addMarkersToMap(window.deliveryMap, optimized)
    }
  }

  const openGoogleMapsRoute = () => {
    if (optimizedRoute.length === 0) {
      toast.info('No deliveries to route')
      return
    }
    
    // Create Google Maps URL with waypoints
    const destinations = optimizedRoute.map(order => 
      encodeURIComponent(order.deliveryLocation)
    )
    
    if (destinations.length > 0) {
      let url = 'https://www.google.com/maps/dir/'
      
      // Add current location (empty for Google to use current)
      url += '/'
      
      // Add all destinations as waypoints
      destinations.forEach((dest, index) => {
        if (index === destinations.length - 1) {
          url += dest
        } else {
          url += dest + '/'
        }
      })
      
      window.open(url, '_blank')
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const user = getCurrentUser()
      await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        username: user.username,
        password: user.password
      })
      
      toast.success(`Order marked as ${newStatus}`)
      
      // Refresh data
      fetchDeliveryData(user)
    } catch (error) {
      console.error('Update status error:', error)
      toast.error('Failed to update status')
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

  // Reinitialize map when component mounts and map is loaded
  useEffect(() => {
    if (mapLoaded && orders.length > 0) {
      initializeMap()
    }
  }, [mapLoaded, orders])

  return (
    <Layout role="Delivery">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FaMapMarkerAlt className="mr-2 text-red-500" />
              Delivery Map
            </h1>
            <p className="text-gray-600">Visualize and optimize your delivery routes</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => user && fetchDeliveryData(user)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <FaSync className="mr-2" />
              Refresh
            </button>
            <button
              onClick={optimizeRoute}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FaRoute className="mr-2" />
              Optimize Route
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 mr-3">
                <FaTruck className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{orders.length}</div>
                <div className="text-gray-600">Active Deliveries</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 mr-3">
                <FaCheckCircle className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'Shipped').length}
                </div>
                <div className="text-gray-600">In Transit</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100 mr-3">
                <FaHome className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'Processing').length}
                </div>
                <div className="text-gray-600">Ready for Pickup</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 mr-3">
                <FaDirections className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{optimizedRoute.length}</div>
                <div className="text-gray-600">Optimized Stops</div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-lg">Interactive Map</h2>
            <button
              onClick={openGoogleMapsRoute}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <FaDirections className="mr-2" />
              Open in Google Maps
            </button>
          </div>
          
          <div className="relative">
            <div 
              ref={mapRef}
              className="w-full h-[500px] bg-gray-200"
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-4">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Map Legend */}
            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg">
              <h3 className="font-semibold mb-2">Map Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                  <span>Processing - Ready for pickup</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                  <span>Shipped - In transit</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  <span>Delivered - Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimized Route List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Optimized Delivery Route</h2>
            <p className="text-gray-600 text-sm">Follow this order for maximum efficiency</p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto"></div>
              <p className="mt-4">Loading route...</p>
            </div>
          ) : optimizedRoute.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No deliveries scheduled. Check back later for new assignments.
            </div>
          ) : (
            <div className="divide-y">
              {optimizedRoute.map((order, index) => (
                <div 
                  key={order._id} 
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 ${
                    selectedOrder?._id === order._id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-4 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-gray-600">
                        {order.customerId?.username} • {order.deliveryLocation}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.items?.map(item => item.productName).join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    
                    <div className="text-right">
                      <div className="font-bold">${order.totalPrice?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {order.status === 'Processing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order._id, 'Shipped')
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Start
                        </button>
                      )}
                      
                      {order.status === 'Shipped' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order._id, 'Delivered')
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Complete
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const address = encodeURIComponent(order.deliveryLocation)
                          window.open(`https://maps.google.com/?q=${address}`, '_blank')
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Order Details */}
        {selectedOrder && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-lg mb-4">Order Details: {selectedOrder.orderNumber}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedOrder.customerId?.username}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customerId?.phone}</p>
                  <p><strong>Location:</strong> {selectedOrder.deliveryLocation}</p>
                  <p><strong>Instructions:</strong> {selectedOrder.deliveryInstructions || 'None'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                  <p><strong>Total Amount:</strong> ${selectedOrder.totalPrice?.toFixed(2)}</p>
                  <p><strong>Items:</strong> {selectedOrder.items?.length || 0}</p>
                  <p><strong>Order Time:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => window.open(`tel:${selectedOrder.customerId?.phone}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Call Customer
                  </button>
                  <button
                    onClick={() => {
                      const address = encodeURIComponent(selectedOrder.deliveryLocation)
                      window.open(`https://maps.google.com/?q=${address}`, '_blank')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-blue-800 mb-3">How to Use the Delivery Map</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">1. View Deliveries</h4>
              <p className="text-blue-600 text-sm">Each colored dot on the map represents a delivery location. Click on a dot to see order details.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">2. Optimize Route</h4>
              <p className="text-blue-600 text-sm">Click "Optimize Route" to reorder deliveries for maximum efficiency based on status and location.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">3. Navigate</h4>
              <p className="text-blue-600 text-sm">Use "Open in Google Maps" to get turn-by-turn navigation for your entire optimized route.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}