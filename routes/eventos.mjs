import express from "express";
import { ObjectId } from "mongodb";

import db from "../connection.mjs";
const eventosCollection = db.collection("eventos");

const app = express.Router();

import axios from "axios";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const geocode = async (lugar) => {
    const uri = "https://geocode.maps.co/search?q=";

    if (!lugar) {
        return ;
    }

    console.log(lugar);
    const response = await axios.get(uri + lugar.replace(/%20/g, "") + ",Spain");

    const data = response.data[0];
    if (data) {
        return ({ lat: data.lat, lon: data.lon });
    } else {
        return ({
            "lat": "36.7209914",
            "lon": "-4.4216968"
        });
    }
};

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
        let filtro = {};
        let orden = {};

        const queries = req.query;

        if (queries.nombre) {
            filtro = { ...filtro, nombre: queries.nombre };
        }

        if (queries.timestamp) {
            filtro = { ...filtro, timestamp: queries.timestamp };
        }

        if (queries.lugar) {
            const ubicacion = await geocode(queries.lugar);

            console.log(ubicacion);

            // la latitud y longitud no difieren en más de 0.2
            filtro = { ...filtro, lat: { $gte: parseFloat(ubicacion.lat) - 0.2, $lte: parseFloat(ubicacion.lat) + 0.2 } };
            filtro = { ...filtro, lon: { $gte: parseFloat(ubicacion.lon) - 0.2, $lte: parseFloat(ubicacion.lon) + 0.2 } };
        }

        if (queries.organizador) {
            filtro = { ...filtro, organizador: queries.organizador };
        }

        if (queries.order == "asc") {
            orden = { ...orden, [queries.orderBy]: 1 };
        } else if (queries.order == "desc") {
            orden = { ...orden, [queries.orderBy]: -1 };
        }

        
        const eventos = await eventosCollection
            .find(filtro)
            .toArray(orden);

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

        if (!req.params.id) {
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
 *      - nombre
 *      - timestamp
 *      - lugar
 *      - lat
 *      - long
 *      - organizador
 *      - imagen
 * 
 */
app.post("/", async (req, res) => {
    try {
        const evento = req.body;

        // Comprobar campos necesarios para la creación y que siga siendo único 

        if (!evento.nombre || !evento.timestamp || !evento.lugar || !evento.organizador || !evento.imagen) {
            res.send("faltan campos").status(400);
            return;
        }

        const ubicacion = await geocode(evento.lugar);


        // Crear usuario con los campos obtenidos
        const result = await eventosCollection.insertOne({
            "nombre": evento.nombre,
            "timestamp": evento.timestamp,
            "lugar": evento.lugar,
            "lat": parseFloat(ubicacion.lat),
            "lon": parseFloat(ubicacion.lon),
            "organizador": evento.organizador,
            "imagen": evento.imagen
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
 *    body (alguno de los campos):
 *      - nombre
 *      - timestamp
 *      - lugar
 *      - lat
 *      - long
 *      - organizador
 *      - imagen
 */
app.put("/:id", async (req, res) => {
    try {


        // Comprobar que la petición no esté vacía
        if (!req.body && !req.body.nombre && !req.body.timestamp && !req.body.lugar && !req.body.lat && !req.body.lon && !req.body.organizador && !req.body.imagen) {
            res.send("todos los campos vacios").status(400);
            return;
        }

        if(req.body.lugar){
            const ubicacion = await geocode(req.body.lugar);
            req.body.lat = ubicacion.lat;
            req.body.lon = ubicacion.lon;
        }

        //Solo modificar los campos que se hayan enviado
        const updateFields = {
            ...((req.body.nombre) ? { "nombre": req.body.nombre } : {}),
            ...((req.body.timestamp) ? { "timestamp": req.body.timestamp } : {}),
            ...((req.body.lugar) ? { "lugar": req.body.lugar } : {}),
            ...((req.body.lugar) ? { "lat": parseFloat(req.body.lat) } : {}),
            ...((req.body.lugar) ? { "lon": parseFloat(req.body.lon) } : {}),
            ...((req.body.organizador) ? { "organizador": req.body.organizador } : {}),
            ...((req.body.imagen) ? { "imagen": req.body.imagen } : {})
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


// app.put("/:id/addImage", async (req, res) => {
//     try {
//         const id = req.params.id;
//         const image = req.body.image;

//         if(!id || !image){
//             res.send("id y image son necesarios").status(400);
//             return;
//         } 

//         const result = await eventosCollection.updateOne(
//             {
//                 _id: new ObjectId(id)
//             }, 
//             {
//                 $push: {
//                     "images": image
//                 }
//             }
//         );

//         res.send(result).status(200);
//     } catch (err) {
//         res.send(err).status(500);
//     }
// });


export default app;