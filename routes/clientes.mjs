import express from "express";
import { ObjectId } from "mongodb";
import axios from "axios";

import db from "../connection.mjs";
const clientesCollection = db.collection("clientes");

const app = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    try {
        let filtro = {};
        let orden = {};

        const queries = req.query;

        if (queries.name) {
            filtro = { ...filtro, name: queries.name };
        }
        if (queries.email) {
            filtro = { ...filtro, email: queries.email };
        }
        if (queries.googleID) {
            filtro = { ...filtro, googleID: queries.googleID };
        }
        if (queries.token) {
            filtro = { ...filtro, oauthToken: queries.oauthToken };
        }

        if (queries.orderBy && queries.order) {
            if (queries.order == "asc") {
                orden = { ...orden, [queries.orderBy]: 1 };
            } else if (queries.order == "desc") {
                orden = { ...orden, [queries.orderBy]: -1 };
            }
        }

        let results = await clientesCollection.find(filtro).sort(orden).toArray();
        res.status(200).send(results);
    } catch (error) {
        res.status(500).send(error);
    }
});


// app.get("/", async (req, res) => {
//     try {  
//         let result = null;

//         // check if is query googleId and take it from clientes Collection
//         if (req.query.googleId) {
//             result = await clientesCollection.findOne({ googleId: req.query.googleId });
//         }else{
//             result = await clientesCollection.find({}).sort({ timestamp: -1 }).toArray();
//         }

//         if (result) {
//             res.status(200).json(result);
//         } else {
//             res.status(401).json({ err: "No login registers found" });
//         }
//     } catch (e) {
//         res.send(e).status(500);
//     }
// });

// update a login register with googleId as param and body as new data (timestamp, exp, token)
app.put("/:googleId", async (req, res) => {
    const { timestamp, exp, token } = req.body;
    const expDate = new Date(exp);
    const tokenDate = new Date(timestamp);

    try {
        const result = await clientesCollection.updateOne(
            { googleId: req.params.googleId },
            { $set: { timestamp: tokenDate, exp: expDate, token: token } }
        );

        if (result) {
            res.status(200).json(result);
        } else {
            res.status(401).json({ err: "No login registers found" });
        }
    } catch (e) {
        res.send(e).status(500);
    }
});

app.post("/", (req, res) => {
    const { timestamp, email, exp, token, googleId } = req.body;
    const expDate = new Date(exp);
    const tokenDate = new Date(timestamp);

    // Post a new login register
    clientesCollection.insertOne(
        {
            email: email,
            exp: expDate,
            token: token,
            timestamp: tokenDate,
            googleId: googleId,
        },
        (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ err: "Something went wrong" });
            } else {
                res.status(200).json({ message: "success" });
            }
        }
    );
});


// app.get("/:id", async (req, res) => {
//     try {
//         const result = await clientesCollection.findOne({ _id: new ObjectId(req.params.id) });
//         res.send(result).status(200);
//     } catch (e) {
//         res.send(e).status(500);
//     }
// });

// app.delete("/:id", async (req, res) => {
//     try {
//         const result = await clientesCollection.deleteOne({
//             _id: new ObjectId(req.params.id),
//         });
//         res.send(result).status(200);
//     } catch (e) {
//         res.send(e).status(500);
//     }
// });

// app.put("/:id", async (req, res) => {
//     try {
//       const cliente = req.body;

//       const result = await clientes.updateOne(
//         { _id: new ObjectId(req.params.id) },
//         { $set: cliente }
//       );
//       res.send(result).status(200);
//     } catch (e) {
//       res.send(e).status(500);
//     }
//   });

export default app;