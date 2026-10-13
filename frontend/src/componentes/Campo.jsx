// Etiqueta, control y mensaje de error de un campo de formulario.
// El control debe llevar aria-describedby={describe(id, error, ayuda)} para que
// el lector de pantalla lea el error o la ayuda junto con el campo.
export const describe = (id, error, ayuda) => (error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined)

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
        <span id={`${id}-error`} className="campo-error" role="alert">
          {error}
        </span>
      ) : (
        ayuda && (
          <span id={`${id}-ayuda`} className="campo-ayuda">
            {ayuda}
          </span>
        )
      )}
    </div>
  )
}
