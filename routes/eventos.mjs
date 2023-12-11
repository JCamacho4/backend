import express from "express";
import { ObjectId } from "mongodb";

import db from "../connection.mjs";
const eventosCollection = db.collection("eventos");

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ================================
 *       EXTRA ENDPOINTS
 * ================================
 */

// Invitar a un evento a un contacto de un usuario, identificado por su email. El contacto invitado se incluirá en la 
// lista de invitados del evento, con la invitación en estado pendiente.
app.post("/:id/invitar", async (req, res) => {
    try {
        const id = req.params.id;
        const email = req.body.email;

        if(!id || !email){
            res.send("id y email son necesarios").status(400);
            return;
        } 

        const result = await eventosCollection.updateOne(
            {
                _id: new ObjectId(id)
            }, 
            {
                $push: {
                    "invitados": {
                        "email": email,
                        "estado": "pendiente"
                    }
                }
            }
        );

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});

// Reprogramar un evento ya pasado, indicando cuánto tiempo se desplaza (un número de días determinado, una 
// semana, un mes, o un año). Se creará un nuevo evento, con la nueva fecha y el resto de valores iguales a los del 
// evento reprogramado.
app.post("/:id/reprogramar", async (req, res) => {
    try {
        const id = req.params.id;
        const dias = req.body.dias;


        if(!id || !dias){
            res.send("id y dias son necesarios").status(400);
            return;
        } 

        const evento = await eventosCollection.findOne({
            _id: new ObjectId(id)
        });

        if (!evento) {
            res.send("evento no encontrado, id incorrecto").status(404);
            return;
        }

        const result = await eventosCollection.insertOne({
            "anfitrion": evento.anfitrion,
            "descripcion": evento.descripcion,
            "inicio": new Date(evento.inicio.getTime() + parseInt(dias) * 86400000),
            "duracion": evento.duracion,
            "invitados": evento.invitados
        });

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});

// Obtener la agenda de un usuario, representada por una lista de eventos, tanto propios como invitados, por orden 
// ascendente de inicio.
app.get("/:email/agenda", async (req, res) => {
    try {
        const email = req.params.email;

        if(!email){
            res.send("email es necesario").status(400);
            return;
        } 

        const eventos = await eventosCollection
            .find({
                $or: [
                    { "anfitrion": email },
                    { "invitados.email": email }
                ]
            })
            .sort({ inicio: 1 })
            .toArray();

        res.send(eventos).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});




/**
 * ================================
 *              CRUD
 * ================================
 */

/**
 * GET ALL    
 */

app.get("/", async (req, res) => {
    try {
        const eventos = await eventosCollection
            .find()
            .toArray();

        res.send(eventos).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});



/**
 * GET
 *   params:
 *      - id
 */

app.get("/:id", async (req, res) => {
    try {

        if(!req.params.id){
            res.send("id required").status(400);
            return;
        } 

        const result = await eventosCollection.findOne({
            _id: new ObjectId(req.params.id)
        });

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});


/**
 * POST
 *    body:
 *      - anfitrion
 *      - descripcion
 *      - inicio
 *      - duracion
 *      - invitados
 * 
 */
app.post("/", async (req, res) => {
    try {
        const evento = req.body;

        // Comprobar campos necesarios para la creación y que siga siendo único 

        if (!evento.anfitrion || !evento.descripcion || !evento.inicio || !evento.duracion || !evento.invitados) {
            res.send("faltan campos").status(400);
            return;
        }

        // Crear usuario con los campos obtenidos
        const result = await eventosCollection.insertOne({
            "anfitrion": evento.anfitrion,
            "descripcion": evento.descripcion,
            "inicio": new Date(evento.inicio),
            "duracion": evento.duracion,
            "invitados": evento.invitados
        });

        res.send(result).status(201);
    } catch (err) {
        res.send(err).status(500);
    }
});


/**
 * PUT
 *  params:
 *      - id
 *  body:
 *      - anfitrion
 *      - descripcion
 *      - inicio
 *      - duracion
 *      - invitados  
 */
app.put("/:id", async (req, res) => {
    try {

        // Comprobar que la petición no esté vacía
        if (!req.body.anfitrion && !req.body.descripcion && !req.body.inicio && !req.body.duracion && !req.body.invitados) {
            res.send("todos los campos vacios").status(400);
            return;
        }

        //Solo modificar los campos que se hayan enviado

        const updateFields = {
            ...((req.body.anfitrion) ? { "anfitrion": req.body.anfitrion } : {}),
            ...((req.body.descripcion) ? { "descripcion": req.body.descripcion } : {}),
            ...((req.body.inicio) ? { "inicio": new Date(req.body.inicio) } : {}),
            ...((req.body.duracion) ? { "duracion": req.body.duracion } : {}),
            ...((req.body.invitados) ? { "invitados": req.body.invitados } : {})
        }

        let result = await eventosCollection.updateOne({
            _id: new ObjectId(req.params.id)
        }, {
            $set: updateFields
        });

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});



/**
 * DELETE
 */

app.delete("/:id", async (req, res) => {
    try {        
        const result = await eventosCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});


export default app;