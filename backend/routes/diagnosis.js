import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/diagnose", async (req, res) => {
    try {
        const { symptoms } = req.body;

        const response = await axios.post(
            "http://localhost:5000/diagnose",
            { symptoms }
        );

        return res.json(response.data);
    } catch (err) {
        console.error("ML Error:", err.message);
        return res.status(500).json({ error: "ML service is offline" });
    }
});

export default router;
