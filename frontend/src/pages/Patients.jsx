import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { patientsAPI } from '../services/api'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function BloodBadge({ type }) {
  if (!type) return <span className="text-ink-300">—</span>
  return (
    <span className="inline-flex items-center font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
      {type}
    </span>
  )
}

function GenderPill({ gender }) {
  if (!gender) return <span className="text-ink-300">—</span>
  const cfg = {
    male:   'bg-azure-50 text-azure-700',
    female: 'bg-pink-50 text-pink-700',
    other:  'bg-ink-100 text-ink-600',
  }
  return (
    <span className={`text-[11px] font-semibold capitalize px-2 py-0.5 rounded-md ${cfg[gender] ?? cfg.other}`}>
      {gender}
    </span>
  )
}

function PatientModal({ patient, onClose }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: patient ?? {} })

  const createMut = useMutation(patientsAPI.create, {
    onSuccess: () => { qc.invalidateQueries('patients'); toast.success('Patient created'); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed to create patient'),
  })
  const updateMut = useMutation((d) => patientsAPI.update(patient.id, d), {
    onSuccess: () => { qc.invalidateQueries('patients'); toast.success('Patient updated'); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed to update patient'),
  })

  const onSubmit = (d) => patient ? updateMut.mutate(d) : createMut.mutate(d)
  const busy = createMut.isLoading || updateMut.isLoading

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink-900">
              {patient ? 'Edit Patient' : 'Register Patient'}
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">All fields marked * are required</p>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-xl text-ink-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">First Name *</label>
                <input {...register('first_name', { required: 'Required' })} className="input-field" placeholder="John" />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="field-label">Last Name *</label>
                <input {...register('last_name', { required: 'Required' })} className="input-field" placeholder="Doe" />
                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Email</label>
                <input {...register('email')} type="email" className="input-field" placeholder="john@example.com" />
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input {...register('phone')} className="input-field" placeholder="+1 234 567 8900" />
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="field-label">Date of Birth</label>
                <input {...register('date_of_birth')} type="date" className="input-field" />
              </div>
              <div>
                <label className="field-label">Gender</label>
                <select {...register('gender')} className="select-field">
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="field-label">Blood Type</label>
                <select {...register('blood_type')} className="select-field">
                  <option value="">Select…</option>
                  {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="field-label">Address</label>
              <input {...register('address')} className="input-field" placeholder="123 Main St, City, State" />
            </div>

            {/* Insurance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Insurance Provider</label>
                <input {...register('insurance_provider')} className="input-field" placeholder="Blue Cross" />
              </div>
              <div>
                <label className="field-label">Insurance Number</label>
                <input {...register('insurance_number')} className="input-field" placeholder="BC-123456" />
              </div>
            </div>

            {/* Emergency contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Emergency Contact</label>
                <input {...register('emergency_contact_name')} className="input-field" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="field-label">Emergency Phone</label>
                <input {...register('emergency_contact_phone')} className="input-field" placeholder="+1 234 567 8901" />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="field-label">Known Allergies</label>
              <textarea {...register('allergies')} className="textarea-field" rows={2} placeholder="Penicillin, Latex…" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : patient ? 'Update Patient' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Patients() {
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const SIZE = 20

  const { data, isLoading } = useQuery(
    ['patients', page, search],
    () => patientsAPI.list({ page, size: SIZE, search: search || undefined }).then(r => r.data),
    { keepPreviousData: true },
  )

  const deleteMut = useMutation(patientsAPI.delete, {
    onSuccess: () => { qc.invalidateQueries('patients'); toast.success('Patient removed') },
    onError:   () => toast.error('Failed to remove patient'),
  })

  const totalPages = data ? Math.ceil(data.total / SIZE) : 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{data?.total?.toLocaleString() ?? '—'} registered patients</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          Add Patient
        </button>
      </div>

      {/* Search + filters */}
      <div className="card !py-4 flex items-center gap-3">
        <div className="search-bar flex-1 max-w-md">
          <svg viewBox="0 0 20 20" fill="currentColor" className="search-bar-icon w-4 h-4">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="search"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <span className="text-xs text-ink-400 font-mono ml-auto">
          {data?.total ?? 0} results
        </span>
      </div>

      {/* Table */}
      <div className="card-md overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>DOB / Gender</th>
                <th>Blood</th>
                <th>Insurance</th>
                <th className="text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="h-4 bg-ink-100 rounded animate-pulse w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : !data?.patients?.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state"><p className="empty-state-icon">👤</p><p className="empty-state-text">No patients found</p></div>
                  </td>
                </tr>
              ) : (
                data.patients.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar w-9 h-9 text-xs bg-azure-50 text-azure-700 border border-azure-100">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-ink-900 text-sm">{p.first_name} {p.last_name}</p>
                          <p className="text-[11px] font-mono text-ink-300">#{String(p.id).padStart(5, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-ink-700">{p.email ?? '—'}</p>
                      <p className="text-xs text-ink-400">{p.phone ?? '—'}</p>
                    </td>
                    <td>
                      <p className="text-xs text-ink-500 font-mono">{p.date_of_birth ?? '—'}</p>
                      <GenderPill gender={p.gender} />
                    </td>
                    <td><BloodBadge type={p.blood_type} /></td>
                    <td className="text-xs text-ink-500">{p.insurance_provider ?? '—'}</td>
                    <td className="text-right pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(p)} className="btn-ghost btn-sm text-azure-600 hover:text-azure-700">Edit</button>
                        <button
                          onClick={() => confirm(`Remove ${p.first_name} ${p.last_name}?`) && deleteMut.mutate(p.id)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700"
                        >Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 bg-ink-50">
            <p className="text-xs text-ink-400">
              Showing <span className="font-mono font-semibold text-ink-600">{(page - 1) * SIZE + 1}–{Math.min(page * SIZE, data.total)}</span> of <span className="font-mono font-semibold text-ink-600">{data.total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="pagination-btn">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`pagination-btn ${p === page ? '!bg-sienna-500 !text-white !border-sienna-500' : ''}`}
                  >{p}</button>
                )
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="pagination-btn">›</button>
            </div>
          </div>
        )}
      </div>

      {modal && <PatientModal patient={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
