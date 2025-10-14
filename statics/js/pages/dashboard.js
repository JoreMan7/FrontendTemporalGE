// Módulo específico para la página de dashboard/inicio
export class DashboardManager {
    static init() {
        // Eliminar el elemento de reloj si existe (por si quedó de una visita anterior)
        const clockElement = document.getElementById('live-clock');
        if (clockElement) {
            clockElement.remove();
        }
        
        this.loadDailyVerse();
    }

    // Cargar versículo del día desde una API bíblica
    static async loadDailyVerse() {
        const verseElement = document.getElementById('resultado');
        if (!verseElement) return;

        try {
            // Usar una API de versículos bíblicos
            const response = await fetch('https://bible-api.com/?random=verse');
            const data = await response.json();
            
            verseElement.innerHTML = `
                <strong>Versículo del día:</strong><br>
                "${data.text}"<br>
                <em>${data.reference}</em>
            `;
        } catch (error) {
            console.error('Error loading daily verse:', error);
            verseElement.innerHTML = `
                <strong>Versículo del día:</strong><br>
                "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."<br>
                <em>Juan 3:16</em>
            `;
        }
    }
}