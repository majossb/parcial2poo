// Adaptador: la hora real del servidor
import type { Reloj } from '../application/ports/reloj.js';

export class RelojDelSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
