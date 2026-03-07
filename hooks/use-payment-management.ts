'use client'

import { useState, useEffect } from 'react'
import { getPayments, generatePaymentsForClient, togglePayment as togglePaymentInDB } from '@/lib/data/payments'
import type { Payment } from '@/lib/data/payments'

const PAYMENTS_STORAGE_KEY = 'client_payments'

export function usePaymentManagement(
  clientId: string,
  frequencyType: string,
  startDate: string,
  endDate: string,
  amount: number
) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [clientId, frequencyType, startDate, endDate, amount])

  const loadPayments = async () => {
    try {
      if (!clientId || !startDate || !endDate) {
        setIsLoaded(true)
        return
      }

      // Generate payments if they don't exist
      await generatePaymentsForClient(clientId, frequencyType, startDate, endDate, amount)

      // Fetch payments from database
      const dbPayments = await getPayments(clientId)
      setPayments(dbPayments)
      setIsLoaded(true)
    } catch (error) {
      console.error('[v0] Error loading payments:', error)
      // Fallback to localStorage
      loadPaymentsFromLocalStorage()
    }
  }

  const loadPaymentsFromLocalStorage = () => {
    try {
      if (typeof window === 'undefined') return

      const stored = localStorage.getItem(PAYMENTS_STORAGE_KEY)
      const allPayments: Payment[] = stored ? JSON.parse(stored) : []
      const clientPayments = allPayments.filter((p) => p.client_id === clientId)

      // If no payments stored, generate them
      if (clientPayments.length === 0) {
        const generated = generatePaymentSchedule(clientId, frequencyType, startDate, endDate, amount)
        setPayments(generated)
        savePaymentsToLocalStorage(generated)
      } else {
        setPayments(clientPayments)
      }

      setIsLoaded(true)
    } catch (error) {
      console.error('[v0] Error loading payments from localStorage:', error)
      setIsLoaded(true)
    }
  }

  const generatePaymentSchedule = (
    cId: string,
    frequency: string,
    start: string,
    end: string,
    value: number
  ): Payment[] => {
    const paymentsList: Payment[] = []
    const startDate = new Date(start)
    const endDate = new Date(end)
    let currentDate = new Date(startDate)

    const frequencyDays: { [key: string]: number } = {
      Semanal: 7,
      Quinzenal: 15,
      Mensal: 30,
      Bimestral: 60,
      Trimestral: 90,
      Anual: 365,
    }

    const daysToAdd = frequencyDays[frequency] || 30

    while (currentDate <= endDate) {
      paymentsList.push({
        id: `${cId}-${currentDate.toISOString().split('T')[0]}`,
        client_id: cId,
        due_date: currentDate.toISOString().split('T')[0],
        amount: value,
        is_paid: false,
        paid_date: null,
      })

      currentDate.setDate(currentDate.getDate() + daysToAdd)
    }

    return paymentsList
  }

  const savePaymentsToLocalStorage = (paymentsList: Payment[]) => {
    try {
      if (typeof window === 'undefined') return

      const stored = localStorage.getItem(PAYMENTS_STORAGE_KEY)
      const allPayments: Payment[] = stored ? JSON.parse(stored) : []
      const filteredPayments = allPayments.filter((p) => p.client_id !== clientId)
      const updated = [...filteredPayments, ...paymentsList]

      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('[v0] Error saving payments to localStorage:', error)
    }
  }

  const togglePayment = async (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId)
    if (!payment) return

    try {
      // Try to update in database first
      await togglePaymentInDB(paymentId, !payment.is_paid)

      // Update local state
      const updated = payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              is_paid: !p.is_paid,
              paid_date: !p.is_paid ? new Date().toISOString().split('T')[0] : null,
            }
          : p
      )
      setPayments(updated)
      savePaymentsToLocalStorage(updated)
    } catch (error) {
      console.error('[v0] Error toggling payment:', error)
    }
  }

  const getTotalDue = () => {
    return payments
      .filter((p) => !p.is_paid)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getTotalPaid = () => {
    return payments
      .filter((p) => p.is_paid)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getPaidCount = () => {
    return payments.filter((p) => p.is_paid).length
  }

  const getPendingCount = () => {
    return payments.filter((p) => !p.is_paid).length
  }

  return {
    payments,
    isLoaded,
    togglePayment,
    getTotalPaid,
    getTotalDue,
    getPaidCount,
    getPendingCount,
  }
}
