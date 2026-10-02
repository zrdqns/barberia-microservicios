import { clientes } from '../api.js'
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
  buscar: 'Buscar por nombre o documento',
  vacioTitulo: 'Aún no hay clientes',
  vacioTexto: 'Cree el primero con el botón «Nuevo cliente».',
  confirmar: (cliente) => `Se eliminará a ${cliente.nombre}. Esta acción no se puede deshacer.`,
}

const columnas = [
  { titulo: 'Nombre', celda: (cliente) => <span className="dato-principal">{cliente.nombre}</span> },
  { titulo: 'Documento', celda: (cliente) => cliente.documento },
  { titulo: 'Teléfono', celda: (cliente) => cliente.telefono },
  { titulo: 'Correo', celda: (cliente) => cliente.correo || '—' },
]

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre completo',
    tipo: 'text',
    completo: true,
    validar: (valor) => (valor.trim() ? '' : 'Escriba el nombre del cliente.'),
  },
  {
    nombre: 'documento',
    etiqueta: 'Documento',
    tipo: 'text',
    teclado: 'numeric',
    validar: (valor) => (/^\d{6,10}$/.test(valor.trim()) ? '' : 'Debe tener entre 6 y 10 dígitos.'),
  },
  {
    nombre: 'telefono',
    etiqueta: 'Teléfono',
    tipo: 'tel',
    validar: (valor) => (/^\d{7,10}$/.test(valor) ? '' : 'Debe tener entre 7 y 10 dígitos.'),
  },
  {
    nombre: 'correo',
    etiqueta: 'Correo',
    tipo: 'email',
    opcional: true,
    completo: true,
    ejemplo: 'nombre@correo.com',
    validar: (valor) => (!valor || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor) ? '' : 'El correo no tiene un formato válido.'),
  },
]

const textoBusqueda = (cliente) => `${cliente.nombre} ${cliente.documento}`

export default function Clientes() {
  return <PaginaCrud api={clientes} textos={textos} columnas={columnas} campos={campos} textoBusqueda={textoBusqueda} />
}
