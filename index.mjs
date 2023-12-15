import express from "express";
import cors from "cors";
import axios from "axios";

// Routes import
import clientes from "./routes/clientes.mjs";
import eventos from "./routes/eventos.mjs";
import cloudinary from "./routes/cloudinary.mjs";

import 'dotenv/config';
const app = express();
const port = process.env.PORT;


// Para verificar el token de los clientes
import db from "./connection.mjs";
const clientesCollection = db.collection("clientes");

// El puerto está en el fichero .env, puede ponerse cualquier otro
// Pero deberá ser consistente con el del fichero "axios.mjs"
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

// La dirección de deploy está en el fichero .env, si no se despliega, se usa localhost
const clients = process.env.CLIENTS != undefined ? process.env.CLIENTS : "localhost";

// Ruta para comprobar el token de un usuario sin sobrecargar la API de Google
// Cada petición del backend debe pasar por aquí previamente
app.get("/verifyToken/:token", async (req, res) => {
    const token = req.params.token;

    if(token == process.env.GOOGLE_CLIENT_ID){
        res.status(200).json({ message: "success" });
        return;
    }

    try {
        // Se busca el token en la base de datos
        const result = await clientesCollection.findOne({ token: token });

        if (result) {
            const currentDate = new Date();
            const expDate = new Date(result.exp);

            // Se comprueba que el token no haya expirado
            if (currentDate < expDate) {
                console.log("token verificado (llamada desde frontend)")
                res.status(200).json({ message: "success" });
            } else {
                console.log("token expirado");
                res.status(401).json({ err: "Token expired" });
            }
        } else {
            console.log("token no encontrado");
            res.status(401).json({ err: "Token not found" });
        }
    } catch (e) {
        res.send(e).status(500);
    }
    // En caso de que el token sea válido, se devuelve un código 200
    // En caso de que no, se devuelve un código 401, que obliga al cliente a volver a hacer login
});

const verifyTokenClientes = async (req, res, next) => {
    try {
        if (req.headers.authorization != process.env.GOOGLE_CLIENT_ID) {
            // Si esta caducado, se devuelve un código 401, que obliga al cliente a volver a hacer login
            const response = await axios.get(`http://${clients}:5000/verifyToken/${req.headers.authorization}`);
            const user = response.data.user;

            // Si el usuario no es el mismo que el del token, se devuelve un código 402, que indica que no está autorizado
            if ((req.method == 'PUT' || req.method == 'DELETE') && req.params.id != user._id) {
                res.status(402).send("Unauthorized action");
                return;
            } else if (req.method == 'DELETE' && req.params.id == undefined) {
                res.status(402).send("Unauthorized action");
                return;
            }

        }


        console.log("Token verified (por una funcion cliente)");
        next();
    } catch {
        res.status(401).send({ error: "Invalid token" });
    }
}

const verifyTokenEventos = async (req, res, next) => {
    try {
        if (req.headers.authorization != process.env.GOOGLE_CLIENT_ID) {
            // Si esta caducado, se devuelve un código 401, que obliga al cliente a volver a hacer login
            const response = await axios.get(`http://${clients}:5000/verifyToken/${req.headers.authorization}`);
            const user = response.data.user;

            // Si el usuario no es el mismo que el del token, se devuelve un código 402, que indica que no está autorizado
            // if ((req.method == 'PUT' || req.method == 'DELETE') && req.params.id != user._id) {
            //     res.status(402).send("Unauthorized action");
            //     return;
            // } else if (req.method == 'DELETE' && req.params.id == undefined) {
            //     res.status(402).send("Unauthorized action");
            //     return;
            // }

            next()

        }
    } catch {
        res.status(401).send({ error: "Invalid token" });
    }
}


app.use("/clientes", verifyTokenClientes, clientes);

app.use("/eventos", verifyTokenEventos, eventos);
app.use("/cloudinary", cloudinary);
