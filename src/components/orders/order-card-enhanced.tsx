"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, Phone, ChevronRight, Eye, Star, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, NEXT_STATUS } from '@/types/orders'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { cn } from '@/lib/utils'

interface OrderCardEnhancedProps {
  order: Order
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>
  isUpdating: boolean
  onSelect: () => void
  index: number
  isUrgent?: boolean
  onToggleUrgent?: (orderId: string) => void
  isSelected?: boolean
}

export function OrderCardEnhanced({ 
  order, 
  onStatusUpdate, 
  isUpdating, 
  onSelect, 
  index,
  isUrgent = false,
  onToggleUrgent,
  isSelected = false
}: OrderCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const nextStatus = NEXT_STATUS[order.order_status]
  const canAdvance = nextStatus !== null

  const getPriorityColor = () => {
    if (isUrgent) return 'border-red-500 bg-red-50 dark:bg-red-900/20'
    if (order.order_status === 'pending') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    return 'border-slate-200 dark:border-slate-700'
  }

  const getTimeElapsed = () => {
    const now = new Date()
    const orderTime = new Date(order.created_at)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 5) return { text: 'Just now', color: 'text-green-600' }
    if (diffInMinutes < 15) return { text: `${diffInMinutes}m ago`, color: 'text-yellow-600' }
    if (diffInMinutes < 30) return { text: `${diffInMinutes}m ago`, color: 'text-orange-600' }
    return { text: `${diffInMinutes}m ago`, color: 'text-red-600' }
  }

  const timeInfo = getTimeElapsed()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform relative group cursor-pointer",
        getPriorityColor(),
        isSelected && "ring-2 ring-blue-500 shadow-xl"
      )}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Urgent Badge */}
      {isUrgent && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse">
            <Zap className="w-3 h-3" />
            <span>URGENT</span>
          </div>
        </motion.div>
      )}

      {/* Status Badge with Animation */}
      <motion.div 
        className={cn(
          "px-4 py-2 text-sm font-medium border-b relative overflow-hidden",
          ORDER_STATUS_COLORS[order.order_status]
        )}
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2">
            <span>{ORDER_STATUS_LABELS[order.order_status]}</span>
            {order.order_status === 'pending' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn("text-xs font-medium", timeInfo.color)}>
              {timeInfo.text}
            </span>
            <span className="text-xs opacity-75">
              {format(new Date(order.created_at), 'HH:mm')}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${(Object.keys(ORDER_STATUS_LABELS).indexOf(order.order_status) + 1) * 16.66}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </motion.div>

      <div className="p-6">
        {/* Order Header with Hover Effects */}
        <motion.div 
          className="flex items-center justify-between mb-4"
          whileHover={{ x: 5 }}
        >
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span>{order.order_number}</span>
              {onToggleUrgent && (
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleUrgent(order.id)
                  }}
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    isUrgent ? "text-red-500" : "text-slate-400 hover:text-yellow-500"
                  )}
                >
                  <Star className={cn("w-4 h-4", isUrgent && "fill-current")} />
                </motion.button>
              )}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {order.customer_name}
            </p>
          </div>
          <motion.div 
            className="text-right"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-2xl font-bold text-green-600">
              Rs {order.total_amount.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </motion.div>
        </motion.div>

        {/* Customer Info with Icons */}
        <div className="space-y-2 mb-4">
          <motion.div 
            className="flex items-center space-x-2 text-sm"
            whileHover={{ x: 5 }}
          >
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{order.customer_phone}</span>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-2 text-sm"
            whileHover={{ x: 5 }}
          >
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400 line-clamp-1">
              {order.delivery_address.street}, {order.delivery_address.city}
            </span>
          </motion.div>
          {order.estimated_delivery_time && (
            <motion.div 
              className="flex items-center space-x-2 text-sm"
              whileHover={{ x: 5 }}
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                ETA: {format(new Date(order.estimated_delivery_time), 'HH:mm')}
              </span>
            </motion.div>
          )}
        </div>

        {/* Expandable Order Items */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 overflow-hidden"
            >
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Items:</p>
              <div className="space-y-1">
                {order.items.map((item, itemIndex) => (
                  <motion.div 
                    key={item.id} 
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIndex * 0.1 }}
                  >
                    <span className="text-slate-600 dark:text-slate-400">
                      {item.quantity}x {item.item_name}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      Rs {item.total_price.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons with Enhanced Interactions */}
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>
          
          {canAdvance && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1"
            >
              <ShimmerButton
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusUpdate(order.id, nextStatus)
                }}
                disabled={isUpdating}
                className="w-full flex items-center justify-center space-x-2"
                shimmerColor="#ffffff"
                background="rgba(59, 130, 246, 1)"
              >
                {isUpdating ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Updating...
                  </motion.span>
                ) : (
                  <>
                    <span>{ORDER_STATUS_LABELS[nextStatus]}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </ShimmerButton>
            </motion.div>
          )}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none rounded-xl"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
      />
    </motion.div>
  )
}
