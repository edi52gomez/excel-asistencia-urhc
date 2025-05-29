import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

console.log("JS cargado correctamente"); // COMPROBACIÓN

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDpU-CB6AzN_aOpsfMxR5WACY4U10zCgzE",
  authDomain: "urhc-c8f40.firebaseapp.com",
  projectId: "urhc-c8f40",
  storageBucket: "urhc-c8f40.appspot.com",
  messagingSenderId: "1029119950128",
  appId: "1:1029119950128:web:2e24d514b85c0eb1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Jugadoras
const jugadorasPorPartido = {
  "Universitario vs UNSJ": [ "Garcia, Makena", "Conte grand, Maria Sol", "Coria, Maria Jose", "Dubos, Rosario", "Gomez, Victoria", "Gonzalez, Maria Jose", "Morales, Florencia", "Scadding sofia", "Perez, Carolina", "Petrignani, Martina", "Rodriguez, Josefina", "Salinas, Juliana", "Salinas, Lucia", "Moreno, Valew", "Scadding, Emma", "Victoria, Rosario", "Jimenez, Sara" ],
  "Universitario vs Lomas Rojo": [ "Garcia, Makena", "Petrignani, Martina", "Coria, Maria Jose", "Dubos, Rosario", "Gomez, Victoria", "Gonzalez, Maria Jose", "Morales, Florencia", "Perez, Carolina", "Rodriguez, Josefina", "Salinas, Juliana", "Salinas, Lucia", "Rodriguez, Pilar", "Scadding, Emma", "Victoria, Rosario", "Gonzalez Pilar", "Giugni, Valentina", "Emma, Esbry" ],
  "Universitario vs UVT": [ "Garcia, Makena", "Petrignani, Martina", "Coria, Maria Jose", "Gomez, Victoria", "Gonzalez, Maria Jose", "Morales, Florencia", "Perez, Carolina", "Rodriguez, Josefina", "Salinas, Juliana", "Salinas, Lucia", "Scadding, Emma", "Victoria, Rosario", "Gonzalez Pilar", "Giugni, Valentina", "Gatica, Guadalupe" ],
  "Universitario vs SJRC Azul": [ "Garcia, Makena", "Petrignani, Martina", "Coria, Maria Jose", "Gomez, Victoria", "Gonzalez, Maria Jose", "Morales, Florencia", "Perez, Carolina", "Rodriguez, Josefina", "Salinas, Juliana", "Salinas, Lucia", "Scadding, Emma", "Victoria, Rosario", "Gonzalez Pilar", "Ferrandiz, Agostina", "Moreno, Valentina", "Rodriguez, Pilar", "Aguilar Luz" ]
};

// Elementos
const selectPartido = document.getElementById("partidoSeleccionado");
const selectJugadora = document.getElementById("jugadoraSeleccionada");

// Cambia jugadoras según partido
selectPartido.addEventListener("change", () => {
  const partido = selectPartido.value;
  const jugadoras = jugadorasPorPartido[partido] || [];
  selectJugadora.innerHTML = '<option value="">-- Seleccioná una jugadora --</option>';
  jugadoras.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = nombre;
    selectJugadora.appendChild(opt);
  });
});

// Form submit
document.getElementById("formVoto").addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Se hizo submit");

  const partido = selectPartido.value;
  const jugadora = selectJugadora.value;

  if (!partido || !jugadora) {
    mostrarToast("⚠️ Por favor completá ambos campos.");
    return;
  }

  if (localStorage.getItem("voto_" + partido)) {
    mostrarToast("⚠️ Ya registraste un voto para este partido.");
    return;
  }

  try {
    await addDoc(collection(db, "destacadas"), {
      partido,
      jugadora,
      timestamp: new Date()
    });
    localStorage.setItem("voto_" + partido, "true");
    mostrarToast("✅ Voto registrado con éxito");
    selectPartido.value = "";
    selectJugadora.innerHTML = '<option value="">-- Primero elegí un partido --</option>';
    mostrarEstadisticas();
  } catch (error) {
    console.error("Error al registrar:", error);
    mostrarToast("❌ Ocurrió un error al registrar el voto.");
  }
});

// Estadísticas
document.getElementById("partidoEstadistica").addEventListener("change", mostrarEstadisticas);

function mostrarEstadisticas() {
  const partidoElegido = document.getElementById("partidoEstadistica").value;
  const resultadosDiv = document.getElementById("resultadosVotos");
  resultadosDiv.innerHTML = "";

  if (!partidoElegido) return;

  getDocs(collection(db, "destacadas")).then((querySnapshot) => {
    const votosPorJugadora = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.partido === partidoElegido) {
        votosPorJugadora[data.jugadora] = (votosPorJugadora[data.jugadora] || 0) + 1;
      }
    });

    if (Object.keys(votosPorJugadora).length === 0) {
      resultadosDiv.innerHTML = "<p>No hay votos registrados para este partido.</p>";
      return;
    }

    resultadosDiv.innerHTML = "<ul>";
    const maxVotos = Math.max(...Object.values(votosPorJugadora));

    for (const [jugadora, votos] of Object.entries(votosPorJugadora)) {
      const porcentaje = Math.round((votos / maxVotos) * 100);
      resultadosDiv.innerHTML += `
        <li style="margin-bottom: 12px;">
          <strong>${jugadora}</strong>: ${votos} voto(s)
          <div style="height: 10px; background: #ccc; border-radius: 5px; margin-top: 5px;">
            <div style="width: ${porcentaje}%; background: #0077b6; height: 100%; border-radius: 5px;"></div>
          </div>
        </li>
      `;
    }

    resultadosDiv.innerHTML += "</ul>";
  });
}

// Toast
function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(mensaje); // fallback
    return;
  }
  toast.textContent = mensaje;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 3000);
}

