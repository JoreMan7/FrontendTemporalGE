// Re-exporta todo desde los módulos divididos
export { TableManager } from "./tables/table-manager.js"
export { TablePagination } from "./tables/table-pagination.js"
export { TableFilters } from "./tables/table-filters.js"

// Re-exportar funciones de helper para compatibilidad
export {
  formatFecha,
  toggleSelectAll,
  updateBulkActions,
  toggleColumn,
  applyColumnVisibility,
  toggleAccordion,
  setupColumnToggle,
  setupAccordion,
} from "./tables/tables-helper.js"
