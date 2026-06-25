import re

with open('src/routes/breeding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'Breeding Operations': 'Gestión Reproductiva',
    'Reproductive Center': 'Centro de Reproducción',
    'Pedigrees, gestations, and genetic inventories inside a unified dashboard.': 'Módulo E.2 · Gestiones de cría, IA, embriones e inventario genético.',
    'New Record': 'Nuevo Registro',
    'Active Gestations': 'Gestaciones Activas',
    'Cycles & Services': 'Ciclos y Saltos',
    'Mares & Donors': 'Yeguas y Receptoras',
    'Genetic Bank': 'Banco Genético',
    'No active gestations': 'No hay gestaciones activas',
    'Log a new pregnancy to track its progress.': 'Registra una nueva preñez para hacerle seguimiento.',
    'Unknown Mare': 'Yegua Desconocida',
    'Expected:': 'FPP:',
    'Est. Progress': 'Progreso Est.',
    'Holt-Winters Forecast': 'Pronóstico Holt-Winters',
    'Predicted probability of successful conception in the next cycle based on historical data.': 'Probabilidad estimada de éxito para el próximo ciclo reproductivo basada en el histórico.',
    'Recent Breeding Cycles': 'Ciclos y Saltos Recientes',
    'Date': 'Fecha',
    'Mare': 'Yegua',
    'Stallion': 'Reproductor',
    'Method': 'Método',
    'Status': 'Estado',
    'No cycles logged': 'No hay registros de saltos',
    'Successful': 'Exitosa',
    'Failed': 'Fallida',
    'No mares registered': 'No hay vientres registrados',
    'Register a mare to track breeding.': 'Registra yeguas como vientres o receptoras.',
    'Unnamed Mare': 'Yegua sin nombre',
    'Cycles logged': 'Ciclos registrados',
    'Current Status': 'Estado actual',
    'Genetic Inventory': 'Inventario Genético',
    'Total Straws': 'Total Pajillas',
    'Embryos': 'Embriones',
    'Material Type': 'Tipo Material',
    'Source': 'Origen / Caballo',
    'Expiration': 'Expiración',
    'No inventory items': 'No hay inventario genético',
    'Owned': 'Propio',
    'Available': 'Disponible',
    'Add Breeding Record': 'Agregar Registro Reproductivo',
    'Select the type of record you want to create:': 'Selecciona el tipo de registro a crear:',
    'New Gestation': 'Nueva Gestación',
    'Log Cycle': 'Registrar Ciclo/Salto',
    'Register Mare': 'Registrar Vientre',
    'Add Genetics': 'Añadir al Banco',
    'Cancel': 'Cancelar',
    'Save Record': 'Guardar Registro',
}

for eng, esp in replacements.items():
    content = content.replace(eng, esp)

with open('src/routes/breeding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Breeding module translated!")
