// Direcciones de los dos microservicios.
// El frontend habla con ambos; api-citas además consume api-catalogo por su cuenta.
export const API_CITAS = 'http://localhost:8080'
export const API_CATALOGO = 'http://localhost:8081'

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

export const estado = {
  citas: () => pedir(API_CITAS, '/api/status'),
  catalogo: () => pedir(API_CATALOGO, '/api/status'),
  // api-citas le pregunta a api-catalogo: comunicación de backend a backend
  conexion: () => pedir(API_CITAS, '/api/conexion/catalogo'),
}
