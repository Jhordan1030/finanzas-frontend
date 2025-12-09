import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/common/Layout/Layout'
import Dashboard from './pages/Dashboard'
import IngresosPage from './pages/IngresosPage'
import GastosPage from './pages/GastosPage'

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
          error: {
            duration: 4000,
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ingresos" element={<IngresosPage />} />
          <Route path="gastos" element={<GastosPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App