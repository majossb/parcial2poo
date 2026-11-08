// Caso de uso: cerrar sesión (RF-01)
//
// Los tokens JWT no se guardan en el servidor, así que cerrar sesión consiste en que el
// cliente descarte su token. Este caso de uso deja el punto de extensión listo (por ejemplo,
// una lista de tokens revocados en una versión futura) sin tener que tocar el controlador.
export class CerrarSesion {
  async ejecutar(_usuarioId: string): Promise<void> {
    // Nada que hacer en el servidor por ahora.
  }
}