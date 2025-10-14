// sacramentos.js
import { apiFetch } from "./api.js";

export async function obtenerSacramentosHabitante(id) {
    return apiFetch(`/habitantes/${id}/sacramentos`, { method: "GET" });
}

export async function asignarSacramento(idHabitante, idSacramento, fecha) {
    return apiFetch(`/habitantes/${idHabitante}/sacramentos`, {
        method: "POST",
        body: JSON.stringify({ id_sacramento: idSacramento, fecha })
    });
}

export async function eliminarSacramento(idHabitante, idSacramento) {
    return apiFetch(`/habitantes/${idHabitante}/sacramentos/${idSacramento}`, {
        method: "DELETE"
    });
}
