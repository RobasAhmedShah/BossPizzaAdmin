"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, NEXT_STATUS } from '@/types/orders'
import { format } from 'date-fns'
import { Clock, MapPin, Phone, DollarSign, Package, ChevronRight, Eye, MessageSquare } from 'lucide-react'
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern'
import { TextAnimate } from '@/components/magicui/text-animate'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { Ripple } from '@/components/magicui/ripple'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (supabase) {
      fetchOrders()
      // Set up real-time subscription
      const subscription = supabase
        .channel('orders_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchOrders = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          if (!supabase) return { ...order, items: [] }
          
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          if (itemsError) throw itemsError

          return { ...order, items: items || [] }
        })
      )

      setOrders(ordersWithItems as Order[])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!supabase) {
      console.warn('Supabase not configured')
      return
    }

    setUpdatingOrder(orderId)
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // Add to status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: newStatus,
          notes: `Status updated to ${ORDER_STATUS_LABELS[newStatus]}`,
          created_by: 'staff'
        })

      if (historyError) throw historyError

      // Refresh orders
      await fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusCounts = () => {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    }

    orders.forEach(order => {
      counts[order.order_status]++
    })

    return counts
  }

  const statusCounts = getStatusCounts()
  const totalOrders = orders.length
  const todayRevenue = orders
    .filter(order => {
      const orderDate = new Date(order.created_at)
      const today = new Date()
      return orderDate.toDateString() === today.toDateString()
    })
    .reduce((sum, order) => sum + order.total_amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
        />
        <div className="relative z-10">
          <TextAnimate 
            animation="blurInUp" 
            by="character" 
            className="text-4xl font-bold text-slate-900 dark:text-slate-100"
          >
            Loading Orders...
          </TextAnimate>
          <Ripple />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.05}
        duration={3}
        repeatDelay={1}
        className="inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
      />

      {/* Header */}
      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <TextAnimate 
              animation="slideUp" 
              by="word"
              className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4"
            >
              Boss Pizza Orders
            </TextAnimate>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Real-time order management and tracking
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Orders</p>
                <div className="flex items-center space-x-2">
                  <NumberTicker 
                    value={totalOrders} 
                    className="text-3xl font-bold text-slate-900 dark:text-slate-100"
                  />
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Pending</p>
                <div className="flex items-center space-x-2">
                  <NumberTicker 
                    value={statusCounts.pending} 
                    className="text-3xl font-bold text-yellow-600"
                  />
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Preparing</p>
                <div className="flex items-center space-x-2">
                  <NumberTicker 
                    value={statusCounts.preparing} 
                    className="text-3xl font-bold text-orange-600"
                  />
                  <Package className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Today&apos;s Revenue</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">₹</span>
                  <NumberTicker 
                    value={todayRevenue} 
                    decimalPlaces={2}
                    className="text-3xl font-bold text-green-600"
                  />
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent" />
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusUpdate={updateOrderStatus}
                isUpdating={updatingOrder === order.id}
                onSelect={() => setSelectedOrder(order)}
                index={index}
              />
            ))}
          </div>

          {!supabase && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <TextAnimate 
                animation="fadeIn" 
                className="text-xl font-medium text-slate-600 dark:text-slate-400"
              >
                Supabase Not Configured
              </TextAnimate>
              <p className="text-slate-500 dark:text-slate-500 mt-2 max-w-md mx-auto">
                To connect to your database, please add your Supabase credentials to the .env.local file:
              </p>
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md mx-auto text-left">
                <code className="text-sm text-slate-700 dark:text-slate-300">
                  NEXT_PUBLIC_SUPABASE_URL=your-url<br/>
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
                </code>
              </div>
            </div>
          )}

          {supabase && orders.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <TextAnimate 
                animation="fadeIn" 
                className="text-xl font-medium text-slate-600 dark:text-slate-400"
              >
                No orders found
              </TextAnimate>
              <p className="text-slate-500 dark:text-slate-500 mt-2">
                New orders will appear here automatically
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>
  isUpdating: boolean
  onSelect: () => void
  index: number
}

function OrderCard({ order, onStatusUpdate, isUpdating, onSelect, index }: OrderCardProps) {
  const nextStatus = NEXT_STATUS[order.order_status]
  const canAdvance = nextStatus !== null

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative group"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Status Badge */}
      <div className={cn(
        "px-4 py-2 text-sm font-medium border-b",
        ORDER_STATUS_COLORS[order.order_status]
      )}>
        <div className="flex items-center justify-between">
          <span>{ORDER_STATUS_LABELS[order.order_status]}</span>
          <span className="text-xs opacity-75">
            {format(new Date(order.created_at), 'HH:mm')}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Order Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {order.order_number}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {order.customer_name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ₹{order.total_amount.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{order.customer_phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400 line-clamp-1">
              {order.delivery_address.street}, {order.delivery_address.city}
            </span>
          </div>
          {order.estimated_delivery_time && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                ETA: {format(new Date(order.estimated_delivery_time), 'HH:mm')}
              </span>
            </div>
          )}
        </div>

        {/* Order Items Preview */}
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Items:</p>
          <div className="space-y-1">
            {order.items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {item.quantity}x {item.item_name}
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  ₹{item.total_price.toFixed(2)}
                </span>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs text-slate-500">
                +{order.items.length - 2} more items
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onSelect}
            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
          
          {canAdvance && (
            <ShimmerButton
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center space-x-2"
              shimmerColor="#ffffff"
              background="rgba(59, 130, 246, 1)"
            >
              {isUpdating ? (
                <span>Updating...</span>
              ) : (
                <>
                  <span>{ORDER_STATUS_LABELS[nextStatus]}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </ShimmerButton>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
    </div>
  )
}

interface OrderDetailModalProps {
  order: Order
  onClose: () => void
}

function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {order.order_number}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Order Details
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 rotate-45" />
            </button>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{order.customer_phone}</p>
              </div>
              {order.company && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Company</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{order.company}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Delivery Address
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <p className="text-slate-900 dark:text-slate-100">
                {order.delivery_address.street}<br />
                {order.delivery_address.city}, {order.delivery_address.state}<br />
                {order.delivery_address.country} - {order.delivery_address.zipCode}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {item.item_name}
                      </h4>
                      {item.item_description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.item_description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        ₹{item.total_price.toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  
                  {item.customizations && Object.keys(item.customizations).length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Customizations:
                      </p>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="text-slate-900 dark:text-slate-100">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Tax</span>
                <span className="text-slate-900 dark:text-slate-100">₹{order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Delivery Fee</span>
                <span className="text-slate-900 dark:text-slate-100">₹{order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-600 pt-2">
                <span className="text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-green-600">₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {order.order_notes && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Order Notes
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-slate-900 dark:text-slate-100">{order.order_notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
