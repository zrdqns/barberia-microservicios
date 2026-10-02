import { barberos } from '../api.js'
import PaginaCrud from '../componentes/PaginaCrud.jsx'

const textos = {
  titulo: 'Barberos',
  descripcion: 'Equipo que atiende las citas.',
  nuevo: 'Nuevo barbero',
  editar: 'Editar barbero',
  eliminar: 'Eliminar barbero',
  guardarNuevo: 'Crear barbero',
  creado: 'Barbero creado',
  actualizado: 'Barbero actualizado',
  eliminado: 'Barbero eliminado',
  buscar: 'Buscar por nombre o especialidad',
  vacioTitulo: 'Aún no hay barberos',
  vacioTexto: 'Cree el primero con el botón «Nuevo barbero».',
  confirmar: (barbero) => `Se eliminará a ${barbero.nombre}. Las citas ya agendadas conservan sus datos.`,
}

const columnas = [
  { titulo: 'Nombre', celda: (barbero) => <span className="dato-principal">{barbero.nombre}</span> },
  { titulo: 'Documento', celda: (barbero) => barbero.documento },
  { titulo: 'Teléfono', celda: (barbero) => barbero.telefono || '—' },
  { titulo: 'Especialidad', celda: (barbero) => barbero.especialidad || '—' },
  {
    titulo: 'Estado',
    celda: (barbero) =>
      barbero.activo ? <span className="etiqueta verde">Activo</span> : <span className="etiqueta gris">Inactivo</span>,
  },
]

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre completo',
    tipo: 'text',
    completo: true,
    validar: (valor) => (valor.trim() ? '' : 'Escriba el nombre del barbero.'),
  },
  {
    nombre: 'documento',
    etiqueta: 'Documento',
    tipo: 'text',
    teclado: 'numeric',
    validar: (valor) => (/^\d{6,10}$/.test(valor.trim()) ? '' : 'Debe tener entre 6 y 10 dígitos.'),
  },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', opcional: true },
  {
    nombre: 'especialidad',
    etiqueta: 'Especialidad',
    tipo: 'text',
    opcional: true,
    completo: true,
    ejemplo: 'Degradados, barba, cortes clásicos…',
  },
  {
    nombre: 'activo',
    etiqueta: 'Barbero activo',
    tipo: 'checkbox',
    inicial: true,
    ayuda: 'Solo los barberos activos pueden recibir citas.',
  },
]

const textoBusqueda = (barbero) => `${barbero.nombre} ${barbero.especialidad ?? ''}`

export default function Barberos() {
  return <PaginaCrud api={barberos} textos={textos} columnas={columnas} campos={campos} textoBusqueda={textoBusqueda} />
}
