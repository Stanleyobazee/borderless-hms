import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { doctorsAPI } from '../services/api'

function DoctorModal({ doctor, departments, onClose }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: doctor ?? {} })

  const createMut = useMutation(doctorsAPI.create, {
    onSuccess: () => { qc.invalidateQueries('doctors'); toast.success('Doctor added'); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed'),
  })
  const updateMut = useMutation((d) => doctorsAPI.update(doctor.id, d), {
    onSuccess: () => { qc.invalidateQueries('doctors'); toast.success('Doctor updated'); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed'),
  })

  const onSubmit = (d) => {
    const payload = {
      ...d,
      department_id:       d.department_id ? Number(d.department_id) : null,
      years_of_experience: d.years_of_experience ? Number(d.years_of_experience) : null,
      consultation_fee:    d.consultation_fee ? Number(d.consultation_fee) : null,
    }
    doctor ? updateMut.mutate(payload) : createMut.mutate(payload)
  }
  const busy = createMut.isLoading || updateMut.isLoading

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink-900">{doctor ? 'Edit Doctor' : 'Add Doctor'}</h2>
            <p className="text-xs text-ink-400 mt-0.5">Fields marked * are required</p>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-xl text-ink-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">First Name *</label>
                <input {...register('first_name', { required: 'Required' })} className="input-field" />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="field-label">Last Name *</label>
                <input {...register('last_name', { required: 'Required' })} className="input-field" />
                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
              <div>
                <label className="field-label">Email *</label>
                <input {...register('email', { required: 'Required' })} type="email" className="input-field" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input {...register('phone')} className="input-field" />
              </div>
              <div>
                <label className="field-label">Specialization *</label>
                <input {...register('specialization', { required: 'Required' })} className="input-field" placeholder="Cardiology" />
                {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization.message}</p>}
              </div>
              <div>
                <label className="field-label">License Number *</label>
                <input {...register('license_number', { required: 'Required' })} className="input-field" placeholder="MD-12345" />
                {errors.license_number && <p className="mt-1 text-xs text-red-500">{errors.license_number.message}</p>}
              </div>
              <div>
                <label className="field-label">Department</label>
                <select {...register('department_id')} className="select-field">
                  <option value="">No department</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Years of Experience</label>
                <input {...register('years_of_experience')} type="number" min="0" className="input-field" />
              </div>
              <div>
                <label className="field-label">Consultation Fee ($)</label>
                <input {...register('consultation_fee')} type="number" step="0.01" className="input-field" />
              </div>
              <div>
                <label className="field-label">Available Days</label>
                <input {...register('available_days')} className="input-field" placeholder="Mon,Tue,Wed,Thu,Fri" />
              </div>
            </div>
            <div>
              <label className="field-label">Bio</label>
              <textarea {...register('bio')} className="textarea-field" rows={3} placeholder="Professional background and areas of expertise…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : doctor ? 'Update Doctor' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SPEC_COLORS = {
  'Cardiology':   'bg-red-50 text-red-700',
  'Neurology':    'bg-purple-50 text-purple-700',
  'Orthopedics':  'bg-amber-50 text-amber-700',
  'Pediatrics':   'bg-pink-50 text-pink-700',
  'Oncology':     'bg-rose-50 text-rose-700',
  'Dermatology':  'bg-orange-50 text-orange-700',
  'Psychiatry':   'bg-indigo-50 text-indigo-700',
  'Radiology':    'bg-cyan-50 text-cyan-700',
}
const specColor = (s) => SPEC_COLORS[s] ?? 'bg-jade-50 text-jade-700'

export default function Doctors() {
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const SIZE = 20

  const { data, isLoading } = useQuery(
    ['doctors', page, search],
    () => doctorsAPI.list({ page, size: SIZE, search: search || undefined }).then(r => r.data),
    { keepPreviousData: true },
  )
  const { data: departments } = useQuery('departments', () => doctorsAPI.listDepartments().then(r => r.data))

  const deleteMut = useMutation(doctorsAPI.delete, {
    onSuccess: () => { qc.invalidateQueries('doctors'); toast.success('Doctor removed') },
  })

  const totalPages = data ? Math.ceil(data.total / SIZE) : 1

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">{data?.total?.toLocaleString() ?? '—'} physicians on staff</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          Add Doctor
        </button>
      </div>

      <div className="card !py-4 flex items-center gap-3">
        <div className="search-bar flex-1 max-w-md">
          <svg viewBox="0 0 20 20" fill="currentColor" className="search-bar-icon w-4 h-4">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="search"
            placeholder="Search by name, specialization or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <span className="text-xs text-ink-400 font-mono ml-auto">{data?.total ?? 0} results</span>
      </div>

      <div className="card-md overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Experience</th>
                <th>Consultation Fee</th>
                <th className="text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-ink-100 rounded animate-pulse w-24" /></td>
                  ))}</tr>
                ))
              ) : !data?.doctors?.length ? (
                <tr><td colSpan={6}>
                  <div className="empty-state"><p className="empty-state-icon">🩺</p><p className="empty-state-text">No doctors found</p></div>
                </td></tr>
              ) : data.doctors.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar w-9 h-9 text-xs bg-jade-50 text-jade-700 border border-jade-100">
                        {doc.first_name[0]}{doc.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-ink-900 text-sm">Dr. {doc.first_name} {doc.last_name}</p>
                        <p className="text-[11px] text-ink-400">{doc.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${specColor(doc.specialization)}`}>
                      {doc.specialization}
                    </span>
                  </td>
                  <td className="text-xs text-ink-500">{doc.department?.name ?? <span className="text-ink-300">—</span>}</td>
                  <td className="text-sm text-ink-600">{doc.years_of_experience != null ? `${doc.years_of_experience} yrs` : <span className="text-ink-300">—</span>}</td>
                  <td className="font-mono text-sm text-ink-700">{doc.consultation_fee != null ? `$${doc.consultation_fee.toFixed(2)}` : <span className="text-ink-300">—</span>}</td>
                  <td className="text-right pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(doc)} className="btn-ghost btn-sm text-azure-600">Edit</button>
                      <button onClick={() => confirm(`Remove Dr. ${doc.last_name}?`) && deleteMut.mutate(doc.id)} className="btn-ghost btn-sm text-red-500">Remove</button>
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
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pagination-btn">›</button>
            </div>
          </div>
        )}
      </div>

      {modal && <DoctorModal doctor={modal === 'create' ? null : modal} departments={departments} onClose={() => setModal(null)} />}
    </div>
  )
}
