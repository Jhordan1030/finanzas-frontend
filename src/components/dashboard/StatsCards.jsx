import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Minus, TrendingUp as ArrowUp, TrendingDown as ArrowDown } from 'lucide-react';

const StatsCards = ({
                      balance,
                      loading,
                      cambioIngresos = 0,
                      cambioGastos = 0
                    }) => {
  if (loading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
          ))}
        </div>
    );
  }

  if (!balance) return null;

  const { ingresos = 0, gastos = 0, total = 0 } = balance;
  const balanceTotal = total || (ingresos - gastos);

  const formatCurrency = (valor) => {
    return valor.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Determinar icono y texto para balance
  const getBalanceInfo = () => {
    if (balanceTotal > 0) {
      return {
        icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600',
        text: '💰 Positivo este mes',
        trend: 'good'
      };
    } else if (balanceTotal < 0) {
      return {
        icon: <DollarSign className="h-6 w-6 text-rose-600" />,
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-600',
        text: '📉 Negativo este mes',
        trend: 'bad'
      };
    } else {
      return {
        icon: <Minus className="h-6 w-6 text-gray-600" />,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        text: '⚖️ Balance neutral',
        trend: 'neutral'
      };
    }
  };

  const balanceInfo = getBalanceInfo();

  // Función para determinar color y texto de cambio
  const getCambioInfo = (valor, esIngreso = true) => {
    if (valor > 0) {
      return {
        color: esIngreso ? 'text-emerald-600' : 'text-rose-600',
        bgColor: esIngreso ? 'bg-emerald-100' : 'bg-rose-100',
        icon: <ArrowUp className="h-6 w-6" />,
        texto: esIngreso ? 'aumentó' : 'aumentó',
        signo: '+'
      };
    } else if (valor < 0) {
      return {
        color: esIngreso ? 'text-amber-600' : 'text-emerald-600',
        bgColor: esIngreso ? 'bg-amber-100' : 'bg-emerald-100',
        icon: <ArrowDown className="h-6 w-6" />,
        texto: esIngreso ? 'disminuyó' : 'disminuyó',
        signo: ''
      };
    } else {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: <Minus className="h-6 w-6 text-gray-600" />,
        texto: 'sin cambio',
        signo: ''
      };
    }
  };

  const cambioIngresosInfo = getCambioInfo(cambioIngresos, true);
  const cambioGastosInfo = getCambioInfo(cambioGastos, false);

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(ingresos)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${cambioIngresosInfo.bgColor}`}>
              <div className={cambioIngresosInfo.color}>
                {cambioIngresosInfo.icon}
              </div>
            </div>
          </div>
          <p className={`text-sm ${cambioIngresosInfo.color}`}>
          <span className="font-medium">
            {cambioIngresosInfo.signo}{cambioIngresos}%
          </span> vs mes anterior
            {cambioIngresos !== 0 && (
                <span className="text-xs text-gray-400 ml-1">
              ({cambioIngresosInfo.texto})
            </span>
            )}
          </p>
        </div>

        {/* Gastos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(gastos)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${cambioGastosInfo.bgColor}`}>
              <div className={cambioGastosInfo.color}>
                {cambioGastosInfo.icon}
              </div>
            </div>
          </div>
          <p className={`text-sm ${cambioGastosInfo.color}`}>
          <span className="font-medium">
            {cambioGastosInfo.signo}{cambioGastos}%
          </span> vs mes anterior
            {cambioGastos !== 0 && (
                <span className="text-xs text-gray-400 ml-1">
              ({cambioGastosInfo.texto})
            </span>
            )}
          </p>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Balance Neto</p>
              <p className={`text-3xl font-bold mt-1 ${balanceInfo.textColor}`}>
                {formatCurrency(balanceTotal)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${balanceInfo.bgColor}`}>
              {balanceInfo.icon}
            </div>
          </div>
          <p className={`text-sm ${balanceInfo.textColor}`}>
            {balanceInfo.text}
            <span className="text-xs text-gray-400 ml-1">
            {balanceInfo.trend === 'good' ? '(bueno)' : balanceInfo.trend === 'bad' ? '(mejorar)' : ''}
          </span>
          </p>
        </div>
      </div>
  );
};

export default StatsCards;