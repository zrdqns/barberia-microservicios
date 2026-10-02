// Espera a que termine la consulta, pero nunca menos de `minimo` milisegundos.
// En local las APIs responden en pocos milisegundos y el esqueleto de carga
// alcanzaría a parpadear; con este mínimo la transición se ve limpia.
// Solo se usa en la primera carga de cada pantalla, no al guardar ni al eliminar.
export async function conMinimo(consulta, minimo = 450) {
  const espera = new Promise((resolver) => setTimeout(resolver, minimo))
  const [resultado] = await Promise.all([consulta, espera])
  return resultado
}
