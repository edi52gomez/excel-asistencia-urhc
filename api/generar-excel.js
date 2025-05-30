import ExcelJS from "exceljs";
import admin from "firebase-admin";

// Leer la variable de entorno (ya cargada en Vercel)
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("asistencias").get();

    const historial = snapshot.docs.map((doc) => ({
      fecha: doc.id,
      asistencia: doc.data(),
    }));

    const fechas = historial.map((d) => d.fecha);
    const nombres = [
      ...new Set(historial.flatMap((d) => Object.keys(d.asistencia))),
    ];

    const wb = new ExcelJS.Workbook();
    const hoja = wb.addWorksheet("Asistencia");

    hoja.addRow(["Asistencia URHC"]);
    hoja.addRow([]);
    hoja.addRow(["Nombre", ...fechas]);

    nombres.forEach((nombre) => {
      const fila = [nombre];
      fechas.forEach((fecha) => {
        const dia = historial.find((d) => d.fecha === fecha);
        const estado = dia?.asistencia?.[nombre] || "";
        fila.push(estado);
      });
      hoja.addRow(fila);
    });

    hoja.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      row.eachCell((cell) => {
        const valor = cell.value;
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        if (valor === "Presente")
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "C6EFCE" },
          };
        else if (valor === "Ausente")
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFC7CE" },
          };
        else if (valor === "Tarde")
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEB9C" },
          };
      });
    });

    const buffer = await wb.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Asistencia_URHC_Completa.xlsx"
    );
    res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar el Excel" });
  }
}
