// Campos de un cliente y sus reglas. Los usan la sección Clientes y el
// formulario de cita, que permite crear un cliente sin salir de él.
// soloDigitos: al escribir se descarta lo que no sea número (espacios, guiones).
export const camposCliente = [
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
    soloDigitos: true,
    validar: (valor) => (/^\d{6,10}$/.test(valor.trim()) ? '' : 'Debe tener entre 6 y 10 dígitos.'),
  },
  {
    nombre: 'telefono',
    etiqueta: 'Teléfono',
    tipo: 'tel',
    soloDigitos: true,
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
