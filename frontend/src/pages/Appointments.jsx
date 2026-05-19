import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { appointmentsAPI, patientsAPI, doctorsAPI } from '../services/api'

const STATUS_BADGE = {
  scheduled:   'badge-scheduled',
  confirmed:   'badge-confirmed',
  completed:   'badge-completed',
  cancelled:   'badge-cancelled',
  in_progress: 'badge-in_progress',
  no_show:     'badge-no_show',
}

const STATUS_OPTIONS = ['scheduled','confirmed','in_progress','completed','cancelled','no_show']

function AppointmentModal({ appointment, onClose }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: appointment
      ? { ...appointment, appointment_time: appointment.appointment_time?.slice(0, 5) }
      : { duration_minutes: 30 },
  })

  const { data: patientsData } = useQuery('patients-sel', () => patientsAPI.list({ size: 500 }).then(r => r.data))
  const { data: doctorsData  } = useQuery('doctors-sel',  () => doctorsAPI.list({ size: 500 }).then(r => r.data))

  const createMut = useMutation(appointmentsAPI.create, {
    onSuccess: () => { qc.invalidateQueries('appointments'); toast.success('Appointment scheduled'); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed to schedule'),
  })
  const updateMut = useMutation((d) => appointmentsAPI.update(appointment.id, d), {
    onSuccess: () => { qc.invalidateQueries('appointments'); toast.success('Appointment updated'); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed'),
  })

  const onSubmit = (d) => {
    const payload = { ...d, patient_id: Number(d.patient_id), doctor_id: Number(d.doctor_id), duration_minutes: Number(d.duration_minutes) || 30 }
    appointment ? updateMut.mutate(payload) : createMut.mutate(payload)
  }
  const busy = createMut.isLoading || updateMut.isLoading

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-lg">
        <div className="modal-header">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink-900">
              {appointment ? 'Update Appointment' : 'Schedule Appointment'}
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">Fields marked * are required</p>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-xl text-ink-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div>
              <label className="field-label">Patient *</label>
              <select {...register('patient_id', { required: 'Required' })} className="select-field">
                <option value="">Select patient…</option>
                {patientsData?.patients?.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
              {errors.patient_id && <p className="mt-1 text-xs text-red-500">{errors.patient_id.message}</p>}
            </div>

            <div>
              <label className="field-label">Doctor *</label>
              <select {...register('doctor_id', { required: 'Required' })} className="select-field">
                <option value="">Select doctor…</option>
                {doctorsData?.doctors?.map(d => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} — {d.specialization}</option>)}
              </select>
              {errors.doctor_id && <p className="mt-1 text-xs text-red-500">{errors.doctor_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Date *</label>
                <input {...register('appointment_date', { required: 'Required' })} type="date" className="input-field" />
                {errors.appointment_date && <p className="mt-1 text-xs text-red-500">{errors.appointment_date.message}</p>}
              </div>
              <div>
                <label className="field-label">Time *</label>
                <input {...register('appointment_time', { required: 'Required' })} type="time" className="input-field" />
                {errors.appointment_time && <p className="mt-1 text-xs text-red-500">{errors.appointment_time.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Duration (minutes)</label>
                <input {...register('duration_minutes')} type="number" min="15" step="15" className="input-field" />
              </div>
              {appointment && (
                <div>
                  <label className="field-label">Status</label>
                  <select {...register('status')} className="select-field">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="field-label">Reason for Visit</label>
              <textarea {...register('reason')} className="textarea-field" rows={2} placeholder="Chief complaint or visit purpose…" />
            </div>

            {appointment && (
              <>
                <div>
                  <label className="field-label">Diagnosis</label>
                  <textarea {...register('diagnosis')} className="textarea-field" rows={2} placeholder="Clinical findings and diagnosis…" />
                </div>
                <div>
                  <label className="field-label">Prescription</label>
                  <textarea {...register('prescription')} className="textarea-field" rows={2} placeholder="Medications and instructions…" />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : appointment ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Appointments() {
  const [modal, setModal] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()
  const SIZE = 20

  const { data, isLoading } = useQuery(
    ['appointments', page, statusFilter],
    () => appointmentsAPI.list({ page, size: SIZE, status: statusFilter || undefined }).then(r => r.data),
    { keepPreviousData: true },
  )

  const cancelMut = useMutation(appointmentsAPI.cancel, {
    onSuccess: () => { qc.invalidateQueries('appointments'); toast.success('Appointment cancelled') },
  })

  const totalPages = data ? Math.ceil(data.total / SIZE) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{data?.total?.toLocaleString() ?? '—'} total appointments</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="card !py-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {[{ v: '', l: 'All' }, ...STATUS_OPTIONS.map(s => ({ v: s, l: s.replace('_', ' ') }))].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => { setStatusFilter(v); setPage(1) }}
              className={`btn btn-sm rounded-lg border text-xs font-semibold capitalize transition-all
                ${statusFilter === v
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-500 border-ink-200 hover:border-ink-400'
                }`}
            >{l}</button>
          ))}
        </div>
        <span className="text-xs text-ink-400 font-mono ml-auto">{data?.total ?? 0} results</span>
      </div>

      {/* Table */}
      <div className="card-md overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th className="text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-ink-100 rounded animate-pulse w-20" /></td>
                  ))}</tr>
                ))
              ) : !data?.appointments?.length ? (
                <tr><td colSpan={7}>
                  <div className="empty-state"><p className="empty-state-icon">📅</p><p className="empty-state-text">No appointments found</p></div>
                </td></tr>
              ) : data.appointments.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="avatar w-8 h-8 text-[11px] bg-azure-50 text-azure-700 border border-azure-100">
                        {appt.patient?.first_name?.[0]}{appt.patient?.last_name?.[0]}
                      </div>
                      <p className="text-sm font-medium text-ink-900">
                        {appt.patient?.first_name} {appt.patient?.last_name}
                      </p>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-ink-700">Dr. {appt.doctor?.first_name} {appt.doctor?.last_name}</p>
                    <p className="text-[11px] text-ink-400">{appt.doctor?.specialization}</p>
                  </td>
                  <td>
                    <p className="text-sm font-medium text-ink-900">
                      {format(parseISO(appt.appointment_date), 'MMM d, yyyy')}
                    </p>
                    <p className="font-mono text-xs text-ink-400">{appt.appointment_time?.slice(0, 5)}</p>
                  </td>
                  <td className="font-mono text-xs text-ink-500">{appt.duration_minutes}min</td>
                  <td><span className={STATUS_BADGE[appt.status] ?? 'badge-scheduled'}>{appt.status?.replace('_', ' ')}</span></td>
                  <td className="max-w-[140px]">
                    <p className="text-xs text-ink-500 truncate">{appt.reason ?? <span className="text-ink-200">—</span>}</p>
                  </td>
                  <td className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(appt)} className="btn-ghost btn-sm text-azure-600">Update</button>
                      {appt.status !== 'cancelled' && (
                        <button
                          onClick={() => confirm('Cancel this appointment?') && cancelMut.mutate(appt.id)}
                          className="btn-ghost btn-sm text-red-500"
                        >Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.total > SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 bg-ink-50">
            <p className="text-xs text-ink-400">
              Showing <span className="font-mono font-semibold text-ink-600">{(page - 1) * SIZE + 1}–{Math.min(page * SIZE, data.total)}</span> of <span className="font-mono font-semibold text-ink-600">{data.total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="pagination-btn">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button key={n} onClick={() => setPage(n)} className={`pagination-btn ${n === page ? '!bg-sienna-500 !text-white !border-sienna-500' : ''}`}>{n}</button>
                )
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pagination-btn">›</button>
            </div>
          </div>
        )}
      </div>

      {modal && <AppointmentModal appointment={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
