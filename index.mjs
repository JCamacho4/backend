import express from "express";

// Routes import
import usuarios from "./routes/usuarios.mjs";
import eventos from "./routes/eventos.mjs";



import 'dotenv/config';
const app = express();
const port = process.env.PORT;
// El puerto está en el fichero .env, puede ponerse cualquier otro
// Pero deberá ser consistente con el del fichero "axios.mjs"

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});

app.use("/usuarios", usuarios);
app.use("/eventos", eventos);