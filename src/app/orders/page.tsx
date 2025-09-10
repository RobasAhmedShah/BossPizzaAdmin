"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/orders'
import { MapPin, Package, ChevronRight, MessageSquare } from 'lucide-react'
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern'
import { TextAnimate } from '@/components/magicui/text-animate'
import { OrderCardEnhanced } from '@/components/orders/order-card-enhanced'
import { PriorityManager } from '@/components/orders/priority-manager'
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

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    if (!supabase) return

    try {
      setUpdatingOrder(orderId)
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, order_status: newStatus, updated_at: new Date().toISOString() }
          : order
      ))

      toast({
        title: "Order Updated",
        description: `Order status changed to ${ORDER_STATUS_LABELS[newStatus]}`,
      })
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrder(null)
    }
  }, [toast])

  const handleToggleUrgent = useCallback((orderId: string) => {
    setUrgentOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
        toast({
          title: "Order Removed",
          description: "Order removed from urgent list",
        })
      } else {
        newSet.add(orderId)
        toast({
          title: "Order Marked Urgent",
          description: "Order added to urgent list",
        })
      }
      return newSet
    })
  }, [toast])

  const handleOrdersFiltered = useCallback((filtered: Order[]) => {
    setFilteredOrders(filtered)
  }, [])


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          className="opacity-40"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <TextAnimate
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
          >
            Boss Pizza Admin
          </TextAnimate>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Order Management Dashboard
          </p>
        </div>

        {/* Priority Manager */}
        <PriorityManager
          orders={orders}
          onOrdersFiltered={handleOrdersFiltered}
          onToggleUrgent={handleToggleUrgent}
          urgentOrders={urgentOrders}
        />


        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Orders List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  isSelected={selectedOrder?.id === order.id}
                />
              ))}
            </div>

            {/* No Orders Message */}
            {filteredOrders.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  No orders found
                </h3>
                <p className="text-slate-500 dark:text-slate-500">
                  {orders.length === 0
                    ? "No orders have been placed yet."
                    : "Try adjusting your filters to see more orders."}
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading orders...</p>
              </div>
            )}
          </div>

          {/* Right Column - Order Details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <OrderDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
              />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Select an Order
                  </h3>
                  <p className="text-slate-500 dark:text-slate-500 text-sm">
                    Click on an order to see details here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

// Order Detail Panel Component
interface OrderDetailPanelProps {
  order: Order
  onClose: () => void
}

function OrderDetailPanel({ order, onClose }: OrderDetailPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-[calc(100vh-8rem)] sticky top-6 flex flex-col">
      <div className="flex items-center justify-between mb-6 p-6 pb-0">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Order #{order.order_number}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
        {/* Order Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Status
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.order_status]}`}
          >
            {ORDER_STATUS_LABELS[order.order_status]}
          </span>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Customer Information
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {order.customer_name}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {order.customer_phone}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Order Items
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {item.item_name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Type: {item.item_type} • Qty: {item.quantity}
                    </p>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Customizations: {JSON.stringify(item.customizations)}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm ml-2">
                    Rs {item.total_price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-medium">Rs {order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Delivery Fee</span>
              <span className="font-medium">Rs {order.delivery_fee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Tax</span>
              <span className="font-medium">Rs {order.tax_amount}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-slate-600 pt-2">
              <span>Total</span>
              <span>Rs {order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.delivery_address && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Delivery Address
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {order.delivery_address.street}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {order.delivery_address.city}, {order.delivery_address.state}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {order.delivery_address.zipCode}, {order.delivery_address.country}
                  </p>
                  {(() => {
                    const address = order.delivery_address as Record<string, unknown>
                    return address.landmark ? (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Landmark: {String(address.landmark)}
                      </p>
                    ) : null
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Notes */}
        {order.order_notes && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Order Notes
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{order.order_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Timestamps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Order Timeline
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Ordered</span>
              <span className="font-medium">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
            {order.updated_at !== order.created_at && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                <span className="font-medium">
                  {new Date(order.updated_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
