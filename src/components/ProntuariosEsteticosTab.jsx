import { useState } from 'react'
import AvaliacaoGeralTab from './AvaliacaoGeralTab'
import AvaliacaoCorporalTab from './AvaliacaoCorporalTab'
import AvaliacaoFacialTab from './AvaliacaoFacialTab'
import AvaliacaoCapilarTab from './AvaliacaoCapilarTab'
import { FileText, User, Smile, Scissors } from 'lucide-react'

export default function ProntuariosEsteticosTab({ pacienteId, paciente }) {
  const [activeTab, setActiveTab] = useState('geral')

  const tabs = [
    { id: 'geral', label: 'Avaliação Geral', icon: FileText },
    { id: 'corporal', label: 'Avaliação Corporal', icon: User },
    { id: 'facial', label: 'Avaliação Facial', icon: Smile },
    { id: 'capilar', label: 'Avaliação Capilar', icon: Scissors },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-4 sm:px-6 py-3 sm:py-4 text-center font-medium transition flex items-center justify-center gap-2 text-xs sm:text-sm lg:text-base ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary bg-primary bg-opacity-5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'geral' && <AvaliacaoGeralTab pacienteId={pacienteId} paciente={paciente} />}
          {activeTab === 'corporal' && <AvaliacaoCorporalTab pacienteId={pacienteId} paciente={paciente} />}
          {activeTab === 'facial' && <AvaliacaoFacialTab pacienteId={pacienteId} paciente={paciente} />}
          {activeTab === 'capilar' && <AvaliacaoCapilarTab pacienteId={pacienteId} paciente={paciente} />}
        </div>
      </div>
    </div>
  )
}

