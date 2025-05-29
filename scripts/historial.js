// === INICIALIZAR FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpU-CB6AzN_aOpsfMxR5WACY4U10zCgzE",
  authDomain: "urhc-c8f40.firebaseapp.com",
  projectId: "urhc-c8f40",
  storageBucket: "urhc-c8f40.firebasestorage.app",
  messagingSenderId: "1029119950128",
  appId: "1:1029119950128:web:2e24d514b85c0eb1b01cf5",
  measurementId: "G-GP9N3PQBD4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const contenedorDia = document.getElementById("historialPorDia");
const contenedorJugadora = document.getElementById("historialPorJugadora");
const filtroSelect = document.getElementById("filtroJugadora");
const modal = document.getElementById("modalJugadora");
const modalNombre = document.getElementById("modalNombre");
const modalHistorial = document.getElementById("modalHistorial");

document.getElementById("btnCerrarModal").addEventListener("click", cerrarModal);

let historial = [];
let historialPorJugador = {};

async function cargarDatos() {
  const querySnapshot = await getDocs(collection(db, "asistencias"));

  historial = [];
  historialPorJugador = {};

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    historial.push(data);

    for (let nombre in data.asistencia) {
      const estado = data.asistencia[nombre];
      if (!historialPorJugador[nombre]) historialPorJugador[nombre] = [];
      if (estado !== "") {
        historialPorJugador[nombre].push({ fecha: data.fecha, estado });
      }
    }
  });

  mostrarPorDia();
  cargarFiltroJugadoras();
  filtrarPorFecha();
}

function mostrarPorDia() {
  contenedorDia.innerHTML = "";
  if (historial.length === 0) {
    contenedorDia.innerHTML = "<p style='text-align:center;'>No hay registros aún.</p>";
    return;
  }

  historial.slice().reverse().forEach(dia => {
    const bloqueDia = document.createElement("div");
    bloqueDia.className = "attendance-item";
    bloqueDia.innerHTML = `<div class="date"><strong>${dia.fecha}</strong></div>`;
    contenedorDia.appendChild(bloqueDia);

    for (let nombre in dia.asistencia) {
      const estado = dia.asistencia[nombre];
      if (estado !== "") {
        const clase = estado.toLowerCase();
        const item = document.createElement("div");
        item.className = `attendance-item ${clase}`;
        item.innerHTML = `
          <div>
            <div class="date">${nombre}</div>
            <div class="status-pill">${estado}</div>
          </div>
          <span class="icon">${estado === "Presente" ? "✔️" : estado === "Ausente" ? "❌" : "⏰"}</span>
        `;
        contenedorDia.appendChild(item);
      }
    }
  });
}

function cargarFiltroJugadoras() {
  filtroSelect.innerHTML = '<option value="">Seleccionar</option>';
  Object.keys(historialPorJugador).sort().forEach(nombre => {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombre;
    filtroSelect.appendChild(option);
  });
}

filtroSelect.addEventListener("change", () => {
  const seleccion = filtroSelect.value;
  if (seleccion === "") return;

  modalNombre.textContent = seleccion;
  modalHistorial.innerHTML = "";

  const registros = historialPorJugador[seleccion] || [];
  if (registros.length === 0) {
    modalHistorial.innerHTML = "<p>No hay registros para esta jugadora.</p>";
  } else {
    registros.slice().reverse().forEach(reg => {
      const clase = reg.estado.toLowerCase();
      const item = document.createElement("div");
      item.className = `attendance-item ${clase}`;
      item.innerHTML = `
        <div>
          <div class="date">${reg.fecha}</div>
          <div class="status-pill">${reg.estado}</div>
        </div>
        <span class="icon">${reg.estado === "Presente" ? "✔️" : reg.estado === "Ausente" ? "❌" : "⏰"}</span>
      `;
      modalHistorial.appendChild(item);
    });
  }
  modal.style.display = "block";
});

function cerrarModal() {
  modal.style.display = "none";
  filtroSelect.value = "";
}

const inputFecha = document.getElementById("filtroFecha");

function filtrarPorFecha() {
  if (!inputFecha) return;

  inputFecha.addEventListener("change", function () {
    const fechaISO = this.value;
    const partes = fechaISO.split("-");
    const fechaObj = new Date(partes[0], partes[1] - 1, partes[2]);
    const fechaCompleta = fechaObj.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    contenedorDia.innerHTML = "";
    const diaEncontrado = historial.find(dia => dia.fechaISO === fechaISO);

    if (!diaEncontrado) {
      contenedorDia.innerHTML = `<p style="text-align:center;">No hay registros para esta fecha.</p>`;
      return;
    }

    const bloqueDia = document.createElement("div");
    bloqueDia.className = "attendance-item";
    bloqueDia.innerHTML = `<div class="date"><strong>${fechaCompleta}</strong></div>`;
    contenedorDia.appendChild(bloqueDia);

    for (let nombre in diaEncontrado.asistencia) {
      const estado = diaEncontrado.asistencia[nombre];
      if (estado !== "") {
        const clase = estado.toLowerCase();
        const item = document.createElement("div");
        item.className = `attendance-item ${clase}`;
        item.innerHTML = `
          <div>
            <div class="date">${nombre}</div>
            <div class="status-pill">${estado}</div>
          </div>
          <span class="icon">${estado === "Presente" ? "✔️" : estado === "Ausente" ? "❌" : "⏰"}</span>
        `;
        contenedorDia.appendChild(item);
      }
    }
  });
}

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.18.5/package/xlsx.mjs";

document.getElementById("exportarExcel").addEventListener("click", () => {
  if (historial.length === 0) {
    alert("No hay registros para exportar");
    return;
  }

  const fechas = [...new Set(historial.map(dia => dia.fecha))].sort();
  const nombresSet = new Set();
  historial.forEach(dia => {
    for (let nombre in dia.asistencia) {
      nombresSet.add(nombre);
    }
  });
  const nombres = Array.from(nombresSet).sort();

  const titulo = ["Asistencia URHC 2025"];
  const cabecera = ["Nombre", ...fechas];
  const filas = nombres.map(nombre => {
    const fila = [nombre];
    fechas.forEach(fecha => {
      const dia = historial.find(d => d.fecha === fecha);
      const estado = dia?.asistencia?.[nombre] || "";
      fila.push(estado);
    });
    return fila;
  });

  const dataFinal = [titulo, [], cabecera, ...filas];
  const ws = XLSX.utils.aoa_to_sheet(dataFinal);
  const rango = XLSX.utils.decode_range(ws['!ref']);

  for (let R = rango.s.r; R <= rango.e.r; ++R) {
    for (let C = 0; C <= rango.e.c; ++C) {
      const celda = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (!celda) continue;

      // Agregar estilos base
      celda.s = celda.s || {};
      celda.s.alignment = { horizontal: "center" };
      celda.s.border = {
        top:    { style: "thin", color: { rgb: "000000" } },
        right:  { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left:   { style: "thin", color: { rgb: "000000" } }
      };

      // Estilos especiales
      const valor = celda.v;
      if (R === 2) { // Fila de encabezado
        celda.s.fill = { fgColor: { rgb: "DCE6F1" } };
        celda.s.font = { bold: true };
      } else if (R > 2) {
        if (valor === "Presente") celda.s.fill = { fgColor: { rgb: "C6EFCE" } };
        else if (valor === "Ausente") celda.s.fill = { fgColor: { rgb: "FFC7CE" } };
        else if (valor === "Tarde") celda.s.fill = { fgColor: { rgb: "FFEB9C" } };
      }
    }
  }

  // Estilizar título
  const celdaTitulo = ws["A1"];
  celdaTitulo.s = {
    font: { sz: 16, bold: true },
    alignment: { horizontal: "center" },
    border: {
      top:    { style: "thin", color: { rgb: "000000" } },
      right:  { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left:   { style: "thin", color: { rgb: "000000" } }
    }
  };

  // Unir celdas para el título
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: cabecera.length - 1 } }
  ];

  // Crear libro y exportar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
  XLSX.writeFile(wb, "Asistencia_URHC_Completa.xlsx");
});


window.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const valorInput = `${yyyy}-${mm}-${dd}`;

  if (inputFecha) {
    inputFecha.value = valorInput;
  }

  cargarDatos();
});

