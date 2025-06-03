// === INICIALIZAR FIREBASE === 
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
    const fechaObj = new Date(fechaISO);
    const fechaCompleta = fechaObj.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    contenedorDia.innerHTML = "";

    const diaEncontrado = historial.find(dia => {
      const partes = dia.fecha.split("/");
      const fechaFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
      return fechaFormateada === fechaISO;
    });

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
document.getElementById("exportarExcel").addEventListener("click", async () => {
  try {
    const response = await fetch("https://us-central1-urhc-c8f40.cloudfunctions.net/generarExcel");

    if (!response.ok) {
      throw new Error("Error al generar el Excel.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Asistencia_URHC_Completa.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("Ocurrió un error al descargar el Excel.");
    console.error(error);
  }
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

