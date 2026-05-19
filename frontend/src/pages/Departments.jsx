import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { doctorsAPI } from '../services/api'

const DEPT_ICONS = {
  Cardiology:     { emoji: '❤️', bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-700' },
  Neurology:      { emoji: '🧠', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
  Orthopedics:    { emoji: '🦴', bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-700' },
  Pediatrics:     { emoji: '👶', bg: 'bg-pink-50',   border: 'border-pink-100',   text: 'text-pink-700' },
  Oncology:       { emoji: '🔬', bg: 'bg-rose-50',   border: 'border-rose-100',   text: 'text-rose-700' },
  Dermatology:    { emoji: '🩹', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
  Psychiatry:     { emoji: '🧘', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
  Radiology:      { emoji: '📡', bg: 'bg-cyan-50',   border: 'border-cyan-100',   text: 'text-cyan-700' },
  Ophthalmology:  { emoji: '👁️', bg: 'bg-teal-50',   border: 'border-teal-100',   text: 'text-teal-700' },
  default:        { emoji: '🏥', bg: 'bg-jade-50',   border: 'border-jade-100',   text: 'text-jade-700' },
}

function deptStyle(name) {
  return DEPT_ICONS[name] ?? DEPT_ICONS.default
}

function AddDeptModal({ onClose }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMut = useMutation(doctorsAPI.createDepartment, {
    onSuccess: () => { qc.invalidateQueries('departments'); toast.success('Department created'); reset(); onClose() },
    onError:   (e) => toast.error(e.response?.data?.detail ?? 'Failed'),
  })

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-md">
        <div className="modal-header">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink-900">Add Department</h2>
            <p className="text-xs text-ink-400 mt-0.5">Create a new hospital department</p>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-xl text-ink-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(d => createMut.mutate(d))}>
          <div className="modal-body">
            <div>
              <label className="field-label">Department Name *</label>
              <input {...register('name', { required: 'Required' })} className="input-field" placeholder="e.g. Cardiology" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea {...register('description')} className="textarea-field" rows={3} placeholder="Brief overview of the department's scope and services…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMut.isLoading} className="btn-primary flex-1">
              {createMut.isLoading ? 'Creating…' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Departments() {
  const [modal, setModal] = useState(false)

  const { data: departments, isLoading } = useQuery('departments', () =>
    doctorsAPI.listDepartments().then(r => r.data)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments?.length ?? '—'} clinical departments</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-ink-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-ink-100 rounded w-3/4" />
                  <div className="h-3 bg-ink-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !departments?.length ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-icon">🏥</p>
            <p className="empty-state-text">No departments yet. Add your first one to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => {
            const style = deptStyle(dept.name)
            return (
              <div
                key={dept.id}
                className="card hover:shadow-card-md transition-all duration-200 cursor-default animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border ${style.bg} ${style.border}`}>
                    {style.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-display font-semibold text-base ${style.text}`}>{dept.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                        dept.is_active ? 'bg-jade-50 text-jade-700 border border-jade-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400 mt-1.5 leading-relaxed line-clamp-2">
                      {dept.description ?? 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-ink-50 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-300">ID #{String(dept.id).padStart(3, '0')}</span>
                  <span className="text-[11px] text-ink-300">
                    {dept.head_doctor_id ? `Head: #${dept.head_doctor_id}` : 'No head assigned'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <AddDeptModal onClose={() => setModal(false)} />}
    </div>
  )
}
