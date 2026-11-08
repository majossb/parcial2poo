// Roles: administrador, administrativo, supervisor, operario
export const ROLES = ['administrador', 'administrativo', 'supervisor', 'operario'] as const;
export type Rol = (typeof ROLES)[number];

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor);
}

// En el diagrama de casos de uso el Administrador generaliza al Administrativo:
// hereda todo lo que este puede hacer. Esa herencia se expresa aquí, en un solo lugar.
export function rolCubre(rolDelUsuario: Rol, rolRequerido: Rol): boolean {
  if (rolDelUsuario === rolRequerido) return true;
  return rolDelUsuario === 'administrador' && rolRequerido === 'administrativo';
}