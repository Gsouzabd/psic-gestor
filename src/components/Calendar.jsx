import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Calendar({ sessions = [], onEventClick, onDayClick, onMultipleSessionsClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Agrupar sessões por data
  const sessionsByDate = useMemo(() => {
    const grouped = {}
    sessions.forEach(session => {
      if (!session.data) return
      
      // Usar a data diretamente se já estiver no formato YYYY-MM-DD
      // ou converter se necessário
      let dateKey = session.data
      if (dateKey.includes('T')) {
        dateKey = dateKey.split('T')[0]
      }
      // Garantir formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        dateKey = format(parseLocalDate(dateKey), 'yyyy-MM-dd')
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(session)
    })
    return grouped
  }, [sessions])

  const renderDays = () => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      const currentDay = day
      const dateKey = format(currentDay, 'yyyy-MM-dd')
      const daySessions = sessionsByDate[dateKey] || []
      const isCurrentMonth = isSameMonth(currentDay, monthStart)
      const isDayToday = isToday(currentDay)

      days.push(
        <div
          key={currentDay.toString()}
          className={`min-h-[60px] sm:min-h-[80px] md:min-h-[100px] border border-gray-200 p-1 sm:p-1.5 md:p-2 ${
            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
          } ${isDayToday ? 'ring-2 ring-primary' : ''} ${
            onDayClick && isCurrentMonth ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={() => {
            if (onDayClick && isCurrentMonth) {
              onDayClick(currentDay)
            }
          }}
        >
          <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
            isDayToday ? 'text-primary font-bold' : 
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {format(currentDay, 'd')}
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            {daySessions.slice(0, 2).map((session) => {
              // Determinar cor baseado no status
              let bgColor = 'bg-secondary text-white'
              if (session.compareceu === true) {
                bgColor = 'bg-primary text-white'
              } else if (session.compareceu === false) {
                bgColor = 'bg-red-500 text-white'
              } else if (session.confirmada_pelo_paciente === true) {
                // Confirmada pelo paciente (mas ainda agendada)
                bgColor = 'bg-blue-500 text-white'
              } else {
                // null = agendado
                bgColor = 'bg-yellow-500 text-white'
              }

              return (
                <button
                  key={session.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(session)
                  }}
                  className={`w-full text-left text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate transition hover:bg-opacity-90 ${bgColor} relative ${
                    session.recorrencia_id ? 'border-l-2 border-blue-400' : ''
                  }`}
                  title={session.recorrencia_id ? 'Agendamento recorrente' : ''}
                >
                  {session.recorrencia_id && (
                    <Repeat className="absolute top-0 right-0 w-2 h-2 text-blue-200 opacity-75" />
                  )}
                  <span className="hidden sm:inline">{session.hora?.slice(0, 5)} - {session.paciente_nome}</span>
                  <span className="sm:hidden">{session.hora?.slice(0, 5)}</span>
                </button>
              )
            })}
            {daySessions.length > 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onMultipleSessionsClick) {
                    onMultipleSessionsClick(currentDay, daySessions)
                  }
                }}
                className="w-full text-left text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 hover:underline px-1 sm:px-2 font-medium cursor-pointer"
                title={`Ver todas as ${daySessions.length} sessões deste dia`}
              >
                +{daySessions.length - 2} mais
              </button>
            )}
          </div>
        </div>
      )

      day = addDays(day, 1)
    }

    return days
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-1.5 sm:p-2 md:p-3 text-center text-xs sm:text-sm font-semibold text-gray-600 bg-gray-50"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  )
}

