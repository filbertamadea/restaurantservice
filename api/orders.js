const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const ALLOWED = process.env.REACT_FE;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware setup
app.use(express.json());
app.use(cors({ origin: ALLOWED }));

// Example route to fetch orders
app.get("/orders", async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Endpoint to save a new order
app.post("/orders", async (req, res) => {
  const { tableNumber, orders } = req.body;
  if (!tableNumber || !Array.isArray(orders)) {
    return res.status(400).json({ error: "Invalid table number or orders" });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .upsert([{ table_number: tableNumber, orders }], {
        onConflict: ["table_number"],
      });

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data);
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

// Endpoint to clear an order by table number
app.delete("/orders/:tableNumber", async (req, res) => {
  const { tableNumber } = req.params;
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("table_number", tableNumber);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: `Order for table ${tableNumber} cleared.` });
});

// Export as a Vercel function
module.exports = app;
