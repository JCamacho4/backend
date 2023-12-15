import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

/* ======= CONEXION A CLOUDINARY ========= */
dotenv.config();
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
});
/* ======= ===================== ========= */


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const app = express.Router();


app.get("/greatest", (req, res) => {
    const folderName = req.query.folderName;

    if (folderName) {
        cloudinary.v2.search
            .expression(`folder:${folderName}/*`)
            .sort_by("public_id", "desc")
            .max_results(30)
            .execute()
            .then((result) => {
                res.json({
                    message: result.total_count > 0 ? "success" : "not found",
                    count: result.total_count,
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ err: "Something went wrong" });
            });
    }else{
        res.status(500).json({ err: "Missing required fields" });
    }
});





// UPLOAD IMAGE
const upload_preset_signed = process.env.UPLOAD_PRESET_SIGNED;
app.post("/images", upload.single("image"), async (req, res) => {
    console.log(req.body.folderName);
    const folderName = req.body.folderName;
    const imageName = req.body.imageName;
    const imageBinaryData = req.file;

    if (folderName && imageBinaryData) {
        const imageBase64 = req.file.buffer.toString("base64");
        const options = {
            folder: folderName,
            public_id: imageName,
            upload_preset: upload_preset_signed,
            overwrite: true,
        };

        cloudinary.v2.uploader
            .upload("data:image/png;base64," + imageBase64, options)
            .then((result) => {
                console.log("success upload");

                res.json({
                    message: "success",
                    result,
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ err: "Something went wrong" });
            });
    } else {
        res.status(500).json({ err: "Missing required fields" });
    }
});


app.delete("/images", (req, res) => {
    console.log(req.body);

    const folderName = req.body.folderName;
    const imageName = req.body.imageName;

    if (folderName && imageName) {
        cloudinary.v2.uploader
            .destroy(folderName + "/" + imageName)
            .then((result) => {
                console.log("success delete");

                res.json({
                    message: "success",
                    result,
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ err: "Something went wrong" });
            });
    } else {
        res.status(500).json({ err: "Missing required fields" });
    }
});



app.delete("/folder", (req, res) => {
    console.log(req.body);

    const folderName = req.body.folderName;

    if (folderName) {
        // delete all images of the folder
        cloudinary.v2.api
            .delete_resources_by_prefix(folderName)
            .then((result) => {
                console.log("success delete");

                // delete the folder
                cloudinary.v2.api
                    .delete_folder("/" + folderName)
                    .then((result) => {
                        console.log("success delete");

                        res.json({
                            message: "success",
                            result,
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).json({ err: "Something went wrong" });
                    });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ err: "Something went wrong" });
            });
    }
});


/**
 * Este punto de acceso en principio no será necesario, ya que almacenaremos las direcciones 
 * de las imágenes en la base de datos  
 */
app.get("/images", (req, res) => {

    const folderName = req.quey.folderName;
    const imageName = req.query.imageName;

    if (folderName && imageName) {
        cloudinary.v2.search
            .expression("public_id:" + folderName + "/" + imageName)
            .sort_by("public_id", "desc")
            .max_results(30)
            .execute()
            .then((result) => {
                res.json({
                    message: result.total_count > 0 ? "success" : "not found",
                    total_count: result.total_count,
                    resources: result.resources.map((resource) => {
                        return {
                            public_id: resource.public_id,
                            folder: resource.folder,
                            secure_url: resource.secure_url,
                            url: resource.url,
                        };
                    }),
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ err: "Something went wrong" });
            });
    }else{
        res.status(500).json({ err: "Missing required fields" });
    }
});

export default app;