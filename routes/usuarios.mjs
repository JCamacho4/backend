import express from "express";
import { ObjectId } from "mongodb";

import db from "../connection.mjs";
const usuariosCollection = db.collection("usuarios");

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ================================
 *        EXTRA ENDPOINTS
 * ================================
 */

// Buscar entre los contactos de un usuario, identificado por su email, a partir de una cadena con parte del nombre
// del contacto, devolviendo una lista de contactos (emails y nombres)

app.get("/:email/contactos/:nombre", async (req, res) => {
    try {
        const email = req.params.email;
        const nombre = req.params.nombre;

        const usuario = await usuariosCollection.findOne({
            "email": email
        });

        if (!usuario) {
            res.send("usuario no encontrado, email incorrecto").status(404);
            return;
        }
        
        const contactos = await usuariosCollection
            .find( 
                { 
                    "email": { $in: usuario.contactos },
                    "nombre": {
                        $regex: nombre,
                        $options: 'i'
                    } 
                } 
                )
            .toArray(); ;

        res.send(contactos).status(200);
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

        const usuarios = await usuariosCollection
            .find()
            .toArray();

        res.send(usuarios).status(200);
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
            res.send("campo id es necesario").status(400);
            return;
        } 

        const result = await usuariosCollection.findOne({
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
 *      - email
 *      - nombre
 *      - contactos
 */
app.post("/", async (req, res) => {
    try {
        const usuario = req.body;

        // Comprobar campos necesarios para la creación

        if (!usuario.email || !usuario.nombre) {
            res.send("campos email y nombre son necesarios").status(400);
            return;
        }

        // Crear usuario con los campos recibidos

        const result = await usuariosCollection.insertOne({
            "email": usuario.email,
            "nombre": usuario.nombre,
            "contactos": usuario.contactos || [],
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
 *      - email
 *      - nombre
 *      - contactos
 */
app.put("/:id", async (req, res) => {
    try {

        // Comprobar que la petición no esté vacía
        if (!req.body.email && !req.body.nombre && !req.body.contactos) {
            res.send("Petición vacía").status(400);
            return;
        }

        //Solo modificar los campos que se hayan enviado

        const updateFields = {
            ...((req.body.email) ? { "email": req.body.email } : {}),
            ...((req.body.nombre) ? { "nombre": req.body.nombre } : {}),
            ...((req.body.contactos) ? { "contactos": req.body.contactos } : {})
        }

        let result = await usuariosCollection.updateOne({
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

        // Borrar la entidad
        const result = await usuariosCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});

/**
 * ================================
 *         CRUD CONTACTOS
 * ================================
 */

/**
 * GET ALL   
 */

app.get("/:id/contactos", async (req, res) => {
    try {
        const user = await usuariosCollection.findOne({
            _id: new ObjectId(req.params.id)
        });

        res.send(user.contactos).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});


/**
 * POST
 *    body:
 *      - "email": "string"
 */
app.post("/:id/contactos", async (req, res) => {
    try {
        const nuevoEmail = req.body.email;

        // Comprobar que se manda el nuevo email

        if (!nuevoEmail) {
            res.send("campo email no enviado").status(400);
            return;
        }

        // Lo añadimos dentro del usuario enviado

        const result = await usuariosCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $push: { 
                "contactos":  nuevoEmail
            } }
        );

        res.send(result).status(201);
    } catch (err) {
        res.send(err).status(500);
    }
});


/**
 * DELETE
 */

app.delete("/:id/contactos/", async (req, res) => {
    try {
        const emailBorrar = req.body.email;

        const result = await usuariosCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $pull: { 
                "contactos":  emailBorrar
            } }
        );

        res.send({"user":result}).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});


export default app;