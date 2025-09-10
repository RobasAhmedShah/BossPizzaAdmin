"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, Clock, AlertTriangle, Filter, Search, SortAsc, SortDesc, Package, CheckCircle, XCircle } from 'lucide-react'
import { Order } from '@/types/orders'
import { cn } from '@/lib/utils'

interface PriorityManagerProps {
  orders: Order[]
  onOrdersFiltered: (filteredOrders: Order[]) => void
  onToggleUrgent: (orderId: string) => void
  urgentOrders: Set<string>
}

type SortOption = 'time' | 'amount' | 'status' | 'priority'
type FilterOption = 'all' | 'urgent' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'

export function PriorityManager({ 
  orders, 
  onOrdersFiltered, 
  urgentOrders 
}: PriorityManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('time')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort orders using useMemo to prevent infinite loops
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm)
      )
    }

    // Apply status filter
    if (filterBy !== 'all') {
      if (filterBy === 'urgent') {
        filtered = filtered.filter(order => urgentOrders.has(order.id))
      } else {
        filtered = filtered.filter(order => order.order_status === filterBy)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'time':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = a.total_amount - b.total_amount
          break
        case 'status':
          const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
          comparison = statusOrder.indexOf(a.order_status) - statusOrder.indexOf(b.order_status)
          break
        case 'priority':
          const aUrgent = urgentOrders.has(a.id) ? 1 : 0
          const bUrgent = urgentOrders.has(b.id) ? 1 : 0
          comparison = bUrgent - aUrgent
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [orders, searchTerm, sortBy, filterBy, sortOrder, urgentOrders])

  // Notify parent component when filtered orders change
  useEffect(() => {
    onOrdersFiltered(filteredOrders)
  }, [filteredOrders, onOrdersFiltered])

  const getFilterCount = useCallback((filter: FilterOption) => {
    if (filter === 'all') return orders.length
    if (filter === 'urgent') return urgentOrders.size
    return orders.filter(order => order.order_status === filter).length
  }, [orders, urgentOrders])

  const filterOptions = [
    { value: 'all', label: 'All Orders', icon: Filter, count: getFilterCount('all') },
  
    { value: 'pending', label: 'Pending', icon: Clock, count: getFilterCount('pending') },
    { value: 'confirmed', label: 'Confirmed', icon: Clock, count: getFilterCount('confirmed') },
    { value: 'preparing', label: 'Preparing', icon: AlertTriangle, count: getFilterCount('preparing') },
    { value: 'ready', label: 'Ready', icon: Star, count: getFilterCount('ready') },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: Package, count: getFilterCount('out_for_delivery') },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, count: getFilterCount('delivered') },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, count: getFilterCount('cancelled') },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search Bar - Full Width */}
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search orders, customers, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto pb-2 flex-1">
          {filterOptions.map((option) => {
            const Icon = option.icon
            const isActive = filterBy === option.value
            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterBy(option.value as FilterOption)}
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
                <motion.span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400"
                  )}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  {option.count}
                </motion.span>
              </motion.button>
            )
          })}
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="time">Time</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'text-blue-600' },
        
          { label: 'Pending', value: orders.filter(o => o.order_status === 'pending').length, color: 'text-yellow-600' },
          { label: 'In Progress', value: orders.filter(o => ['confirmed', 'preparing'].includes(o.order_status)).length, color: 'text-orange-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
          >
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
