import { useQuery } from 'react-query'
import { statsAPI, appointmentsAPI } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'

const STATUS_BADGE = {
  scheduled:   'badge-scheduled',
  confirmed:   'badge-confirmed',
  completed:   'badge-completed',
  cancelled:   'badge-cancelled',
  in_progress: 'badge-in_progress',
  no_show:     'badge-no_show',
}

const PIE_COLORS = ['#1d6fa4', '#1a7f5a', '#c9622f', '#d97706', '#8b5cf6']

function StatCard({ label, value, icon, accent, delay }) {
  return (
    <div className={`stat-card anim-${delay}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${accent}`}>
          {icon}
        </div>
        <span className="text-xs font-mono text-ink-300 bg-ink-50 px-2 py-1 rounded-lg border border-ink-100">
          Live
        </span>
      </div>
      <div>
        <p className="text-3xl font-display font-semibold text-ink-900 leading-none">
          {value ?? <span className="text-ink-200 text-2xl">—</span>}
        </p>
        <p className="text-sm text-ink-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-white/10">
      <p className="text-ink-400 mb-1">{label}</p>
      <p className="font-semibold">{payload[0].value} appointments</p>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery(
    'stats',
    () => statsAPI.get().then(r => r.data),
    { refetchInterval: 30000 },
  )

  const { data: todayData } = useQuery(
    'today-appts',
    () => appointmentsAPI.today().then(r => r.data),
    { refetchInterval: 60000 },
  )

  const today = format(new Date(), 'EEEE, MMMM do')

  // Mock weekly trend (replace with real data if available)
  const weekTrend = [
    { day: 'Mon', v: 12 }, { day: 'Tue', v: 19 }, { day: 'Wed', v: 14 },
    { day: 'Thu', v: 22 }, { day: 'Fri', v: 18 }, { day: 'Sat', v: 7 },
    { day: 'Sun', v: 4 },
  ]

  const pieData = stats ? [
    { name: 'Scheduled', value: stats.appointments_scheduled || 0 },
    { name: 'Today',     value: stats.appointments_today || 0 },
    { name: 'Total',     value: Math.max(0, (stats.total_appointments || 0) - (stats.appointments_scheduled || 0) - (stats.appointments_today || 0)) },
  ].filter(d => d.value > 0) : []

  const appointments = todayData?.appointments ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">Good morning 👋</h1>
          <p className="page-subtitle">{today} — here's what's happening today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-ink-400 font-mono bg-white border border-ink-100 rounded-xl px-3 py-2 shadow-card">
          <span className="w-2 h-2 rounded-full bg-jade-500 animate-pulse" />
          {format(new Date(), 'HH:mm')} system time
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={isLoading ? null : stats?.total_patients?.toLocaleString()}
          icon="👤"
          accent="bg-azure-50 text-azure-600"
          delay={1}
        />
        <StatCard
          label="Total Doctors"
          value={isLoading ? null : stats?.total_doctors?.toLocaleString()}
          icon="🩺"
          accent="bg-jade-50 text-jade-600"
          delay={2}
        />
        <StatCard
          label="Appointments Today"
          value={isLoading ? null : stats?.appointments_today?.toLocaleString()}
          icon="📅"
          accent="bg-sienna-50 text-sienna-600"
          delay={3}
        />
        <StatCard
          label="Pending Review"
          value={isLoading ? null : stats?.appointments_scheduled?.toLocaleString()}
          icon="⏳"
          accent="bg-amber-50 text-amber-600"
          delay={4}
        />
      </div>

      {/* Charts + schedule row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="xl:col-span-2 card animate-fade-up anim-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-base text-ink-900">Weekly Appointments</h2>
              <p className="text-xs text-ink-400 mt-0.5">Appointment volume over the past 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weekTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9622f" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#c9622f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8c959f' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8c959f' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#c9622f"
                strokeWidth={2}
                fill="url(#grad)"
                dot={{ fill: '#c9622f', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#c9622f', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card animate-fade-up anim-3">
          <h2 className="font-display font-semibold text-base text-ink-900 mb-1">Status Mix</h2>
          <p className="text-xs text-ink-400 mb-4">Appointment status breakdown</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-ink-500">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-ink-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-300 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Today's schedule */}
      <div className="card animate-fade-up anim-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-semibold text-base text-ink-900">Today's Schedule</h2>
            <p className="text-xs text-ink-400 mt-0.5">{format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
          <span className="text-[11px] font-mono bg-ink-50 border border-ink-200 text-ink-500 px-2.5 py-1.5 rounded-lg">
            {appointments.length} appointments
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">📋</p>
            <p className="empty-state-text">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {appointments.map((appt, i) => (
              <div
                key={appt.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-ink-50 transition-colors"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Time */}
                <div className="text-right w-14 flex-shrink-0">
                  <p className="font-mono text-sm font-semibold text-ink-800">
                    {appt.appointment_time?.slice(0, 5)}
                  </p>
                  <p className="text-[10px] text-ink-300">{appt.duration_minutes}min</p>
                </div>

                {/* Divider line */}
                <div className="w-px h-10 bg-ink-100 flex-shrink-0" />

                {/* Patient avatar */}
                <div className="w-8 h-8 rounded-lg bg-azure-50 border border-azure-100 flex items-center justify-center text-azure-700 text-xs font-bold flex-shrink-0">
                  {appt.patient?.first_name?.[0]}{appt.patient?.last_name?.[0]}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {appt.patient?.first_name} {appt.patient?.last_name}
                  </p>
                  <p className="text-xs text-ink-400 truncate">
                    Dr. {appt.doctor?.first_name} {appt.doctor?.last_name}
                    {appt.doctor?.specialization && ` · ${appt.doctor.specialization}`}
                  </p>
                </div>

                {/* Status */}
                <span className={STATUS_BADGE[appt.status] ?? 'badge-scheduled'}>
                  {appt.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
