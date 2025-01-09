const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws"); // Import WebSocket library
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED = process.env.REACT_FE;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  // Example: Send data to client
  ws.send(JSON.stringify({ message: "Welcome to WebSocket server!" }));

  // Example: Broadcast a message to all connected clients
  ws.on("message", (message) => {
    console.log("Received message from client:", message);
    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// Upgrade HTTP requests to WebSocket
app.server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Middleware setup
app.use(express.json());
app.use(cors({ origin: ALLOWED })); // Allow frontend access

// Example route to fetch orders from Supabase
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
    // Use upsert with onConflict to avoid inserting duplicates for table_number
    const { data, error } = await supabase
      .from("orders")
      .upsert([{ table_number: tableNumber, orders }], {
        onConflict: ["table_number"],
      }); // Add onConflict option

    if (error) {
      console.error("Error during upsert:", error);
      return res.status(500).json({ error: error.message });
    }

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
