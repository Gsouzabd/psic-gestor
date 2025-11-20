import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, LogOut, User, Menu, X, Shield, Settings, ClipboardCheck, DollarSign } from 'lucide-react'
import NotificationBadge from './NotificationBadge'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile, isAdmin, isEsteticista } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard-financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/pacientes', icon: Users, label: 'Pacientes' },
    { path: '/confirmacoes', icon: ClipboardCheck, label: 'Confirmações' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : []),
  ]

  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl lg:text-2xl font-bold text-primary">
              {isEsteticista ? 'Estetic Gestor' : 'Psic Gestor'}
            </h1>
            {profile && <NotificationBadge />}
          </div>
          {profile && (
            <p className="text-xs lg:text-sm text-gray-600 mt-2 flex items-center gap-2 truncate">
              <User className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="truncate">{profile.nome_completo}</span>
            </p>
          )}
        </div>

        <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm lg:text-base">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-3 lg:p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm lg:text-base">Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}

