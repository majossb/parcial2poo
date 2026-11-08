# Aplica las migraciones (y opcionalmente los seeds) al contenedor de PostgreSQL.
# Uso (desde la carpeta backend):
#   .\database\aplicar.ps1            -> solo migraciones
#   .\database\aplicar.ps1 -Seeds     -> migraciones y datos iniciales
param([switch]$Seeds)

$ErrorActionPreference = "Stop"
$contenedor = "mantenimiento_db"
$usuario = "mantenimiento"
$baseDatos = "mantenimiento"

function Aplicar($carpeta) {
    Get-ChildItem (Join-Path $PSScriptRoot "$carpeta\*.sql") | Sort-Object Name | ForEach-Object {
        Write-Host "Aplicando $carpeta\$($_.Name)"
        Get-Content $_.FullName -Raw -Encoding UTF8 |
            docker exec -i $contenedor psql -U $usuario -d $baseDatos -v ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) { throw "Fallo $($_.Name)" }
    }
}

Aplicar "migrations"
if ($Seeds) { Aplicar "seeds" }
Write-Host "Listo."
