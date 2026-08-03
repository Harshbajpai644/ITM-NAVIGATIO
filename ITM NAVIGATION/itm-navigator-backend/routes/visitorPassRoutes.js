import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      full_name,
      mobile,
      email,
      department,
      purpose,
      destination,
      visit_time,
    } = req.body;

    const { data, error } = await supabase
      .from("visitor_passes")
      .insert([
        {
          full_name,
          mobile,
          email,
          department,
          purpose,
          destination,
          visit_time,
          status: "pending",
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      message: "Visitor Pass Created Successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;