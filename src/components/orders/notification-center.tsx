"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCircle, AlertCircle, Clock, Package, Truck, Check } from 'lucide-react'
import { Order, OrderStatus } from '@/types/orders'
import { useToast } from '@/hooks/use-toast'
import { useNotificationSound, useSuccessSound } from '@/hooks/use-sound'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'new_order' | 'status_update' | 'urgent' | 'completed'
  title: string
  message: string
  orderId?: string
  timestamp: Date
  read: boolean
}

interface NotificationCenterProps {
  orders: Order[]
  onOrderSelect?: (orderId: string) => void
}

export function NotificationCenter({ orders, onOrderSelect }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()
  const notificationSound = useNotificationSound()
  const successSound = useSuccessSound()

  // Track order changes and generate notifications
  useEffect(() => {
    const previousOrders = new Map<string, Order>()
    
    // Initialize with current orders
    orders.forEach(order => {
      previousOrders.set(order.id, order)
    })

    // This would typically be handled by real-time subscriptions
    // For demo purposes, we'll simulate notifications
    const interval = setInterval(() => {
      // Simulate new order notification
      if (Math.random() < 0.1) { // 10% chance every interval
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'new_order',
          title: 'New Order Received',
          message: `Order #${Math.floor(Math.random() * 10000)} has been placed`,
          timestamp: new Date(),
          read: false
        }
        
        addNotification(newNotification)
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [orders])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10
    setUnreadCount(prev => prev + 1)
    
    // Play sound (only if available)
    try {
      if (notification.type === 'urgent') {
        notificationSound.play()
      } else {
        successSound.play()
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }

    // Show toast
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'urgent' ? 'warning' : 'success'
    })
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_order':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'status_update':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-slate-500" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_order':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'status_update':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      case 'completed':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      default:
        return 'border-l-slate-500 bg-slate-50 dark:bg-slate-900/20'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200"
      >
        <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "p-4 border-l-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer",
                        getNotificationColor(notification.type),
                        !notification.read && "bg-opacity-50"
                      )}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.orderId && onOrderSelect) {
                          onOrderSelect(notification.orderId)
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeNotification(notification.id)
                                }}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
