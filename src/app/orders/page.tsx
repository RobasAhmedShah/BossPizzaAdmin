"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/orders'
// import { format } from 'date-fns' // Removed unused import
import { Clock, MapPin, DollarSign, Package, ChevronRight, MessageSquare } from 'lucide-react'
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern'
import { TextAnimate } from '@/components/magicui/text-animate'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { OrderCardEnhanced } from '@/components/orders/order-card-enhanced'
import { PriorityManager } from '@/components/orders/priority-manager'
import { NotificationCenter } from '@/components/orders/notification-center'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [urgentOrders, setUrgentOrders] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchOrders = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

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
      setFilteredOrders(ordersWithItems as Order[])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

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
  }, [fetchOrders])

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!supabase) {
      console.warn('Supabase not configured')
      return
    }

    try {
      setUpdatingOrder(orderId)

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

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
      
      toast({
        title: "Status Updated",
        description: `Order ${orderId} status updated to ${ORDER_STATUS_LABELS[newStatus]}`,
        variant: "success"
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleToggleUrgent = useCallback((orderId: string) => {
    setUrgentOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
        toast({
          title: "Priority Removed",
          description: "Order priority removed",
          variant: "default"
        })
      } else {
        newSet.add(orderId)
        toast({
          title: "Priority Set",
          description: "Order marked as urgent",
          variant: "warning"
        })
      }
      return newSet
    })
  }, [toast])

  const handleOrdersFiltered = useCallback((filtered: Order[]) => {
    setFilteredOrders(filtered)
  }, [])

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

  const getTodayRevenue = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return orders
      .filter(order => {
        const orderDate = new Date(order.created_at)
        orderDate.setHours(0, 0, 0, 0)
        return orderDate.getTime() === today.getTime() && order.order_status !== 'cancelled'
      })
      .reduce((sum, order) => sum + order.total_amount, 0)
  }

  const statusCounts = getStatusCounts()
  const todayRevenue = getTodayRevenue()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <TextAnimate 
            animation="fadeIn" 
            className="text-xl font-medium text-slate-600 dark:text-slate-400"
          >
            Loading orders...
          </TextAnimate>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={4}
          className="opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
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
            <NotificationCenter 
              orders={orders}
              onOrderSelect={(orderId) => {
                const order = orders.find(o => o.id === orderId)
                if (order) setSelectedOrder(order)
              }}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Orders</p>
                <div className="flex items-center space-x-2">
                  <NumberTicker
                    value={orders.length}
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">In Progress</p>
                <div className="flex items-center space-x-2">
                  <NumberTicker
                    value={statusCounts.confirmed + statusCounts.preparing}
                    className="text-3xl font-bold text-orange-600"
                  />
                  <MessageSquare className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent" />
            </div>

           
          </div>

          {/* Priority Manager */}
          <PriorityManager
            orders={orders}
            onOrdersFiltered={handleOrdersFiltered}
            onToggleUrgent={handleToggleUrgent}
            urgentOrders={urgentOrders}
          />

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order, index) => (
              <OrderCardEnhanced 
                key={order.id} 
                order={order} 
                onStatusUpdate={updateOrderStatus}
                isUpdating={updatingOrder === order.id}
                onSelect={() => setSelectedOrder(order)}
                index={index}
                isUrgent={urgentOrders.has(order.id)}
                onToggleUrgent={handleToggleUrgent}
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
                Supabase not configured
              </TextAnimate>
              <p className="text-slate-500 dark:text-slate-500 mt-2">
                Please set up your Supabase credentials to view orders
              </p>
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Add these to your .env.local file:
                </p>
                <code className="text-xs text-slate-800 dark:text-slate-200 block">
                  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url<br/>
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
                </code>
              </div>
            </div>
          )}

          {supabase && filteredOrders.length === 0 && orders.length > 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <TextAnimate 
                animation="fadeIn" 
                className="text-xl font-medium text-slate-600 dark:text-slate-400"
              >
                No orders match your filters
              </TextAnimate>
              <p className="text-slate-500 dark:text-slate-500 mt-2">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

          {supabase && orders.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <TextAnimate 
                animation="fadeIn" 
                className="text-xl font-medium text-slate-600 dark:text-slate-400"
              >
                No orders yet
              </TextAnimate>
              <p className="text-slate-500 dark:text-slate-500 mt-2">
                Orders will appear here when customers place them
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

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

interface OrderDetailModalProps {
  order: Order
  onClose: () => void
}

function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Order Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Order Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Order #:</span> {order.order_number}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${ORDER_STATUS_COLORS[order.order_status]}`}>
                    {ORDER_STATUS_LABELS[order.order_status]}
                  </span>
                </p>
                <p><span className="font-medium">Payment:</span> {order.payment_method}</p>
                <p><span className="font-medium">Total:</span> 
                  <span className="text-green-600 font-bold ml-2">Rs {order.total_amount.toFixed(2)}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                {order.company && (
                  <p><span className="font-medium">Company:</span> {order.company}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Delivery Address</h3>
            <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div className="text-sm">
                  <p>{order.delivery_address.street}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.state}</p>
                  <p>{order.delivery_address.zipCode}</p>
                  {(() => {
                    const address = order.delivery_address as Record<string, unknown>;
                    if (address.landmark) {
                      return <p className="text-slate-500 mt-1">Landmark: {String(address.landmark)}</p>;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.item_name}</p>
                    {item.item_description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.item_description}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-1">Quantity: {item.quantity}</p>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Customizations:</p>
                        <div className="text-xs text-slate-500 mt-1">
                          {Object.entries(item.customizations).map(([key, value]) => (
                            <p key={key}>• {key}: {String(value)}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Rs {item.total_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Rs {item.unit_price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>Rs {order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>Rs {order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Total:</span>
                <span className="text-green-600">Rs {order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {order.order_notes && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Order Notes</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-slate-700 dark:text-slate-300">{order.order_notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
