// Etiqueta, control y mensaje de error de un campo de formulario.
export default function Campo({ id, etiqueta, opcional = false, error, ayuda, completo = false, children }) {
  const clases = ['campo']
  if (completo) clases.push('completo')
  if (error) clases.push('con-error')

  return (
    <div className={clases.join(' ')}>
      <label htmlFor={id}>
        {etiqueta} {opcional && <span className="opcional">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : (
        ayuda && <span className="campo-ayuda">{ayuda}</span>
      )}
    </div>
  )
}
