export class TablePagination {
  constructor(tableManager) {
    this.tableManager = tableManager
    this.currentPage = 1
    this.itemsPerPage = 10
  }

  setupEvents() {
    const pageSizeSelector = document.querySelector(".page-size-selector select")
    if (pageSizeSelector) {
      pageSizeSelector.addEventListener("change", (e) => {
        this.itemsPerPage = Number.parseInt(e.target.value)
        this.currentPage = 1
        this.tableManager.updateTableWithPagination()
      })
    }
    this.updateButtons()
  }

  getPaginatedData(data) {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  updateInfo(totalItems) {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1
    const endIndex = Math.min(this.currentPage * this.itemsPerPage, totalItems)
    const el = document.querySelector(".pagination-info")
    if (el) el.textContent = `Mostrando ${startIndex} - ${endIndex} de ${totalItems} registros`
  }

  updateButtons() {
    const totalPages = Math.ceil(this.tableManager.filteredData.length / this.itemsPerPage)
    const container = document.querySelector(".pagination-buttons")
    if (!container) return

    container.innerHTML = ""

    const prev = document.createElement("button")
    prev.className = "page-btn"
    prev.textContent = "Anterior"
    prev.disabled = this.currentPage === 1
    prev.onclick = () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.tableManager.updateTableWithPagination()
      }
    }
    container.appendChild(prev)

    const startPage = Math.max(1, this.currentPage - 2)
    const endPage = Math.min(totalPages, this.currentPage + 2)
    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement("button")
      btn.className = `page-btn ${i === this.currentPage ? "active" : ""}`
      btn.textContent = i
      btn.onclick = () => {
        this.currentPage = i
        this.tableManager.updateTableWithPagination()
      }
      container.appendChild(btn)
    }

    const next = document.createElement("button")
    next.className = "page-btn"
    next.textContent = "Siguiente"
    next.disabled = this.currentPage === totalPages
    next.onclick = () => {
      if (this.currentPage < totalPages) {
        this.currentPage++
        this.tableManager.updateTableWithPagination()
      }
    }
    container.appendChild(next)
  }

  reset() {
    this.currentPage = 1
  }
}
