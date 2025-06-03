const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ExcelJS = require("exceljs");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

exports.generarExcel = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const snapshot = await db.collection("asistencias").get();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Asistencias");

      sheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Nombre", key: "nombre", width: 30 },
        { header: "Estado", key: "estado", width: 15 },
      ];

      snapshot.forEach(doc => {
        const data = doc.data();
        const fecha = data.fecha;
        const asistencia = data.asistencia;

        if (asistencia && typeof asistencia === "object") {
          Object.entries(asistencia).forEach(([nombre, estado]) => {
            if (estado && estado !== "") {
              sheet.addRow({
                fecha,
                nombre,
                estado
              });
            }
          });
        }
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=asistencia_URHC.xlsx");

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error al generar el Excel:", error);
      res.status(500).send("Error generando el archivo.");
    }
  });
});

