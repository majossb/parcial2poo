// Puerto: hora actual (se reemplaza por un reloj falso en las pruebas)
// Existe para poder fijar la hora en las pruebas.
export interface Reloj {
  ahora(): Date;
}