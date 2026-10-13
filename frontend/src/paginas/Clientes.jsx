import { clientes } from '../api.js'
import { camposCliente } from '../camposCliente.js'
import PaginaCrud from '../componentes/PaginaCrud.jsx'

const textos = {
  titulo: 'Clientes',
  descripcion: 'Personas que agendan citas en la barbería.',
  nuevo: 'Nuevo cliente',
  editar: 'Editar cliente',
  eliminar: 'Eliminar cliente',
  guardarNuevo: 'Crear cliente',
  creado: 'Cliente creado',
  actualizado: 'Cliente actualizado',
  eliminado: 'Cliente eliminado',
  buscar: 'Buscar por nombre, documento o teléfono',
  vacioTitulo: 'Aún no hay clientes',
  vacioTexto: 'Sin clientes no se pueden agendar citas.',
  ninguno: 'Ningún cliente',
  confirmar: (cliente) =>
    `Se eliminará a ${cliente.nombre} (documento ${cliente.documento}). Esta acción no se puede deshacer.`,
}

const columnas = [
  { titulo: 'Nombre', clase: 'principal', celda: (cliente) => cliente.nombre },
  { titulo: 'Documento', clase: 'numero-id', celda: (cliente) => cliente.documento },
  { titulo: 'Teléfono', clase: 'numero-id', celda: (cliente) => cliente.telefono },
  { titulo: 'Correo', celda: (cliente) => cliente.correo || <span className="sin-dato">Sin correo</span> },
]

const textoBusqueda = (cliente) => `${cliente.nombre} ${cliente.documento} ${cliente.telefono}`

export default function Clientes() {
  return (
    <PaginaCrud api={clientes} textos={textos} columnas={columnas} campos={camposCliente} textoBusqueda={textoBusqueda} />
  )
}
