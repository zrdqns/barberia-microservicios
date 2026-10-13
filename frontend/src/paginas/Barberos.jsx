import { barberos } from '../api.js'
import PaginaCrud from '../componentes/PaginaCrud.jsx'
import Sello from '../componentes/Sello.jsx'

const textos = {
  titulo: 'Barberos',
  descripcion: 'Equipo que atiende las citas. Cada barbero activo tiene su silla en la agenda.',
  nuevo: 'Nuevo barbero',
  editar: 'Editar barbero',
  eliminar: 'Eliminar barbero',
  guardarNuevo: 'Crear barbero',
  creado: 'Barbero creado',
  actualizado: 'Barbero actualizado',
  eliminado: 'Barbero eliminado',
  buscar: 'Buscar por nombre o especialidad',
  vacioTitulo: 'Aún no hay barberos',
  vacioTexto: 'Sin un barbero activo no se pueden agendar citas.',
  ninguno: 'Ningún barbero',
  confirmar: (barbero) => `Se eliminará a ${barbero.nombre}. Las citas ya agendadas conservan sus datos.`,
}

const columnas = [
  { titulo: 'Nombre', clase: 'principal', celda: (barbero) => barbero.nombre },
  { titulo: 'Documento', clase: 'numero-id', celda: (barbero) => barbero.documento },
  {
    titulo: 'Teléfono',
    clase: 'numero-id',
    celda: (barbero) => barbero.telefono || <span className="sin-dato">Sin teléfono</span>,
  },
  {
    titulo: 'Especialidad',
    celda: (barbero) => barbero.especialidad || <span className="sin-dato">Sin especialidad</span>,
  },
  {
    titulo: 'Estado',
    celda: (barbero) => (barbero.activo ? <Sello tono="ok">Activo</Sello> : <Sello tono="apagado">Inactivo</Sello>),
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
    soloDigitos: true,
    validar: (valor) => (/^\d{6,10}$/.test(valor.trim()) ? '' : 'Debe tener entre 6 y 10 dígitos.'),
  },
  { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', soloDigitos: true, opcional: true },
  {
    nombre: 'especialidad',
    etiqueta: 'Especialidad',
    tipo: 'text',
    opcional: true,
    completo: true,
    ejemplo: 'Degradados, barba, cortes clásicos',
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
