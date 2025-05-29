import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {    
  apiKey: "AIzaSyDpU-CB6AzN_aOpsfMxR5WACY4U10zCgzE",
  authDomain: "urhc-c8f40.firebaseapp.com",
  projectId: "urhc-c8f40",
  storageBucket: "urhc-c8f40.appspot.com",
  messagingSenderId: "1029119950128",
  appId: "1:1029119950128:web:2e24d514b85c0eb1b01cf5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  document.getElementById("pantallaCarga").style.display = "flex";

  try {
    const credenciales = await signInWithEmailAndPassword(auth, email, password);
    const user = credenciales.user;

    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Redirige según el permiso
      if (data.permiso === "admin") {
        window.location.href = "./Asistencia.html";
      } else {
        window.location.href = "./historial.html";
      }
    } else {
      document.getElementById("pantallaCarga").style.display = "none";
      mensaje.textContent = "⚠️ Usuario sin permiso configurado.";
    }

    form.reset();


    } catch (error) {
       document.getElementById("pantallaCarga").style.display = "none";
        let mensajeError = "❌ Ocurrió un error. Intentá nuevamente.";
        if (error.code === "auth/wrong-password") {
            mensajeError = "❌ Contraseña incorrecta.";
        } else if (error.code === "auth/user-not-found") {
          mensajeError = "❌ Usuario no encontrado.";
        }

        mensaje.textContent = mensajeError;
    }

});
