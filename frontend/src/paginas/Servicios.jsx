import { servicios } from '../api.js'
import PaginaCrud from '../componentes/PaginaCrud.jsx'
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
  vacioTexto: 'Cree el primero con el botón «Nuevo servicio».',
  confirmar: (servicio) =>
    `Se eliminará el servicio «${servicio.nombre}». Las citas ya agendadas conservan sus datos.`,
}

const columnas = [
  { titulo: 'Servicio', celda: (servicio) => <span className="dato-principal">{servicio.nombre}</span> },
  { titulo: 'Descripción', clase: 'secundario', celda: (servicio) => servicio.descripcion || '—' },
  { titulo: 'Duración', clase: 'numero', celda: (servicio) => `${servicio.duracionMinutos} min` },
  { titulo: 'Precio', clase: 'numero', celda: (servicio) => formatoPesos(servicio.precio) },
  {
    titulo: 'Estado',
    celda: (servicio) =>
      servicio.activo ? <span className="etiqueta verde">Activo</span> : <span className="etiqueta gris">Inactivo</span>,
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
