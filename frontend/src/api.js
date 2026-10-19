// Direcciones de los dos microservicios.
// El frontend habla con ambos; api-citas además consume api-catalogo por su cuenta.
// En local corren en estos puertos; en Vercel llegan al compilar en VITE_API_CITAS y VITE_API_CATALOGO.
export const API_CITAS = import.meta.env.VITE_API_CITAS ?? 'http://localhost:8080'
export const API_CATALOGO = import.meta.env.VITE_API_CATALOGO ?? 'http://localhost:8081'
export const EN_LOCAL = API_CITAS.startsWith('http://localhost')

// Dónde está cada microservicio: "Puerto 8080" en local o su dominio en Vercel
export const lugar = (base) => (EN_LOCAL ? `Puerto ${new URL(base).port}` : new URL(base).host)

const NOMBRES = {
  [API_CITAS]: 'api-citas',
  [API_CATALOGO]: 'api-catalogo',
}

// Hace la petición y devuelve el cuerpo ya convertido.
// Si algo falla lanza un Error con un mensaje que se puede mostrar al usuario.
async function pedir(base, ruta, metodo = 'GET', cuerpo) {
  let respuesta

  try {
    respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new Error(`No hay conexión con ${NOMBRES[base]}. Verifique que el microservicio esté encendido.`)
  }

  const texto = await respuesta.text()
  let datos = texto
  try {
    datos = JSON.parse(texto)
  } catch {
    // La respuesta era texto plano (por ejemplo /api/status)
  }

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje ?? `La operación falló (HTTP ${respuesta.status}).`)
  }
  return datos
}

// Las cinco operaciones que comparte cada recurso REST
function recurso(base, ruta) {
  return {
    listar: () => pedir(base, ruta),
    crear: (datos) => pedir(base, ruta, 'POST', datos),
    actualizar: (id, datos) => pedir(base, `${ruta}/${id}`, 'PUT', datos),
    eliminar: (id) => pedir(base, `${ruta}/${id}`, 'DELETE'),
  }
}

export const clientes = recurso(API_CITAS, '/api/clientes')
export const servicios = recurso(API_CATALOGO, '/api/servicios')
export const barberos = recurso(API_CATALOGO, '/api/barberos')

export const citas = {
  ...recurso(API_CITAS, '/api/citas'),
  cambiarEstado: (id, estado) => pedir(API_CITAS, `/api/citas/${id}/estado`, 'PATCH', { estado }),
}

// Horario de atención por día de la semana. Lo guarda api-citas, que no deja agendar fuera de él.
export const horario = {
  listar: () => pedir(API_CITAS, '/api/horario'),
}

export const estado = {
  citas: () => pedir(API_CITAS, '/api/status'),
  catalogo: () => pedir(API_CATALOGO, '/api/status'),
  // api-citas le pregunta a api-catalogo: comunicación de backend a backend
  conexion: () => pedir(API_CITAS, '/api/conexion/catalogo'),
}
