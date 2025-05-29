// === IMPORTACIONES FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// === CONFIGURACIÓN FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyDpU-CB6AzN_aOpsfMxR5WACY4U10zCgzE",
  authDomain: "urhc-c8f40.firebaseapp.com",
  projectId: "urhc-c8f40",
  storageBucket: "urhc-c8f40.appspot.com",
  messagingSenderId: "1029119950128",
  appId: "1:1029119950128:web:2e24d514b85c0eb1b01cf5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === VERIFICAR PERMISO ===
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("../pages/login.html");
    return;
  }

  const usuarioDoc = await getDoc(doc(db, "usuarios", user.uid));
  if (!usuarioDoc.exists()) {
    alert("Usuario sin permiso registrado.");
    window.location.href = "../pages/login.html";
    return;
  }

  const permiso = usuarioDoc.data().permiso;
  if (permiso !== "admin") {
    alert("Acceso denegado. Solo permitido para administradores.");
    window.location.href = "../pages/login.html";
    return;
  }

  iniciarAsistencia(); // acceso habilitado
});

// === FUNCIÓN PRINCIPAL ===
function iniciarAsistencia() {
  const jugadoras = [
    "Maria Jose Coria", "Makena Garcia", "Guadalupe Gatica", "Valentina Giugni",
    "Victoria Gomez", "Maria Jose Gonzalez", "Pilar Gonzalez", "Florencia Morales",
    "Carolina Perez", "Martin Petrignani", "Josefina Rodriguez", "Juliana Salinas",
    "Lucia Salinas", "Emma Scadding", "Rosario Victoria"
  ];

  const contenedor = document.getElementById("contenedorAsistencia");

  jugadoras.forEach(nombre => {
    const card = document.createElement("div");
    card.className = "card-jugadora";

    const label = document.createElement("span");
    label.textContent = nombre;

    const select = document.createElement("select");
    select.className = "select-asistencia";
    select.name = nombre;

    ["", "Presente", "Ausente", "Tarde"].forEach(opcion => {
      const opt = document.createElement("option");
      opt.value = opcion;
      opt.textContent = opcion || "Seleccionar...";
      select.appendChild(opt);
    });

    card.appendChild(label);
    card.appendChild(select);
    contenedor.appendChild(card);
  });

  function mostrarToast(tipo, mensaje) {
    const toast = document.getElementById(`toast-${tipo}`);
    if (!toast) return;

    const prefijo = tipo === "success" ? "✅" : "⚠️";
    toast.textContent = `${prefijo} ${mensaje}`;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 4000);
  }

  document.getElementById("asistenciaForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const asistencia = {};
    let hayFaltantes = false;

    jugadoras.forEach(nombre => {
      const select = document.querySelector(`select[name="${nombre}"]`);
      const valor = select.value;
      asistencia[nombre] = valor;

      if (valor === "") {
        select.classList.add("incompleto");
        hayFaltantes = true;
      } else {
        select.classList.remove("incompleto");
      }
    });

    const inputFecha = document.getElementById("fechaAsistencia");
    const fechaInput = inputFecha.value;

    if (!fechaInput) {
      mostrarToast("error", "Seleccioná una fecha antes de guardar.");
      return;
    }

    const partes = fechaInput.split("-");
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    const fechaFormateada = fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    const registro = {
      fecha: fechaFormateada,
      fechaISO: fechaInput,
      asistencia: asistencia
    };

    try {
      await addDoc(collection(db, "asistencias"), registro);
      mostrarToast("success", "Asistencia guardada en la nube.");
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      mostrarToast("error", "Error al guardar en la base de datos.");
    }

    if (hayFaltantes) {
      mostrarToast("error", "Hay jugadoras sin asistencia marcada.");
    }
  });
}

// === CERRAR SESIÓN ===
const cerrarSesionMenu = document.getElementById("cerrarSesionMenu");
if (cerrarSesionMenu) {
  cerrarSesionMenu.addEventListener("click", (e) => {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        window.location.href = "../pages/login.html";
      })
      .catch(error => {
        console.error("Error al cerrar sesión:", error);
        alert("❌ No se pudo cerrar la sesión.");
      });
  });
}
