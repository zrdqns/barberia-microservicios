import { servicios } from '../api.js'
import PaginaCrud from '../componentes/PaginaCrud.jsx'
import Sello from '../componentes/Sello.jsx'
import { formatoPesos } from '../formato.js'

const textos = {
  titulo: 'Servicios',
  descripcion: 'Lo que ofrece la barbería, con su precio y duración.',
  nuevo: 'Nuevo servicio',
  editar: 'Editar servicio',
  eliminar: 'Eliminar servicio',
  guardarNuevo: 'Crear servicio',
  creado: 'Servicio creado',
  actualizado: 'Servicio actualizado',
  eliminado: 'Servicio eliminado',
  buscar: 'Buscar por nombre',
  vacioTitulo: 'Aún no hay servicios',
  vacioTexto: 'Sin un servicio activo no se pueden agendar citas.',
  ninguno: 'Ningún servicio',
  confirmar: (servicio) =>
    `Se eliminará el servicio «${servicio.nombre}». Las citas ya agendadas conservan sus datos.`,
}

const columnas = [
  { titulo: 'Servicio', clase: 'principal', celda: (servicio) => servicio.nombre },
  {
    titulo: 'Descripción',
    clase: 'secundario',
    celda: (servicio) => servicio.descripcion || <span className="sin-dato">Sin descripción</span>,
  },
  { titulo: 'Duración', clase: 'numero', celda: (servicio) => `${servicio.duracionMinutos} min` },
  { titulo: 'Precio', clase: 'numero', celda: (servicio) => formatoPesos(servicio.precio) },
  {
    titulo: 'Estado',
    celda: (servicio) => (servicio.activo ? <Sello tono="ok">Activo</Sello> : <Sello tono="apagado">Inactivo</Sello>),
  },
]

const campos = [
  {
    nombre: 'nombre',
    etiqueta: 'Nombre',
    tipo: 'text',
    completo: true,
    validar: (valor) => (valor.trim() ? '' : 'Escriba el nombre del servicio.'),
  },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', opcional: true, completo: true },
  {
    nombre: 'precio',
    etiqueta: 'Precio (pesos)',
    tipo: 'number',
    ejemplo: '25000',
    validar: (valor) => (Number(valor) > 0 ? '' : 'El precio debe ser mayor que cero.'),
  },
  {
    nombre: 'duracionMinutos',
    etiqueta: 'Duración (minutos)',
    tipo: 'number',
    ejemplo: '30',
    validar: (valor) => (Number(valor) >= 5 && Number(valor) <= 240 ? '' : 'Debe estar entre 5 y 240 minutos.'),
  },
  {
    nombre: 'activo',
    etiqueta: 'Servicio activo',
    tipo: 'checkbox',
    inicial: true,
    ayuda: 'Solo los servicios activos se pueden agendar.',
  },
]

const textoBusqueda = (servicio) => servicio.nombre

export default function Servicios() {
  return <PaginaCrud api={servicios} textos={textos} columnas={columnas} campos={campos} textoBusqueda={textoBusqueda} />
}
