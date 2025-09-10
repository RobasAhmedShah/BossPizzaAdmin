"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TextAnimate } from '@/components/magicui/text-animate'
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { Ripple } from '@/components/magicui/ripple'
import { Pizza, ArrowRight, BarChart3, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()

  // Auto-redirect to orders page after a brief welcome
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/orders')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Background Pattern */}
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Logo and Welcome */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-orange-500 rounded-full p-4 mr-4">
              <Pizza className="w-12 h-12 text-white" />
            </div>
            <TextAnimate 
              animation="slideUp" 
              by="word"
              className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-slate-100"
            >
              Boss Pizza
            </TextAnimate>
          </div>
          
          <TextAnimate 
            animation="blurInUp" 
            by="word"
            className="text-2xl lg:text-3xl font-semibold text-slate-700 dark:text-slate-300 mb-4"
            delay={0.5}
          >
            Order Management System
          </TextAnimate>
          
          <TextAnimate 
            animation="fadeIn" 
            by="word"
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
            delay={1}
          >
            Real-time order tracking, seamless workflow management, and beautiful analytics for your restaurant operations.
          </TextAnimate>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Real-time Updates</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Instant notifications and live order status tracking
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Beautiful Analytics</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Visual insights and performance metrics at a glance
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Team Friendly</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Intuitive interface designed for restaurant staff
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <ShimmerButton
            onClick={() => router.push('/orders')}
            className="px-8 py-4 text-lg font-medium"
            shimmerColor="#ffffff"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          >
            <span className="flex items-center space-x-2">
              <span>View Orders Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </span>
          </ShimmerButton>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Redirecting to orders dashboard in a few seconds...
        </p>
      </div>

      {/* Ripple Effect */}
      <Ripple />
    </div>
  )
}
