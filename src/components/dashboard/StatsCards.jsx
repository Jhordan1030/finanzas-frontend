import React from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

const StatsCards = ({ balance, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-24 bg-gray-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!balance) return null

  // Extraer valores con compatibilidad hacia atrás
  const totalIngresos = balance.totalIngresos || balance.ingresos || 0
  const totalGastos = balance.totalGastos || balance.gastos || 0
  const balanceTotal = balance.balance || balance.total || (totalIngresos - totalGastos)

  // Calcular porcentajes de cambio (simulados por ahora)
  const cambioIngresos = 15 // porcentaje
  const cambioGastos = -5   // porcentaje

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Ingresos */}
      <div className="card hover-lift">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${totalIngresos.toLocaleString('es-ES', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <p className={`text-sm ${cambioIngresos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span className="font-medium">
            {cambioIngresos >= 0 ? '+' : ''}{cambioIngresos}%
          </span> desde el mes pasado
        </p>
      </div>

      {/* Gastos */}
      <div className="card hover-lift">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${totalGastos.toLocaleString('es-ES', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <p className={`text-sm ${cambioGastos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span className="font-medium">
            {cambioGastos >= 0 ? '+' : ''}{cambioGastos}%
          </span> desde el mes pasado
        </p>
      </div>

      {/* Balance */}
      <div className="card hover-lift">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Balance</p>
            <p className={`text-3xl font-bold mt-1 ${
              balanceTotal >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              ${balanceTotal.toLocaleString('es-ES', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            balanceTotal >= 0 ? 'bg-blue-100' : 'bg-red-100'
          }`}>
            <DollarSign className={`h-6 w-6 ${
              balanceTotal >= 0 ? 'text-blue-600' : 'text-red-600'
            }`} />
          </div>
        </div>
        <p className={`text-sm ${balanceTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {balanceTotal >= 0 ? 'Positivo' : 'Negativo'} este mes
        </p>
      </div>
    </div>
  )
}

export default StatsCards