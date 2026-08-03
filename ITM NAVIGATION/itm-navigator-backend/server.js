import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./config/supabase.js";
import visitorPassRoutes from "./routes/visitorPassRoutes.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/visitor-pass", visitorPassRoutes);

// Home Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ITM Campus Navigator Backend Running ",
  });
});

// Supabase Test Route
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("visitor_passes")
      .select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});