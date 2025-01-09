const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const method = req.method;

  try {
    if (method === "GET") {
      // Fetch all orders
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === "POST") {
      // Save a new order
      const { tableNumber, orders } = req.body;
      if (!tableNumber || !Array.isArray(orders)) {
        return res
          .status(400)
          .json({ error: "Invalid table number or orders" });
      }

      const { data, error } = await supabase
        .from("orders")
        .upsert([{ table_number: tableNumber, orders }], {
          onConflict: ["table_number"],
        });
      if (error) throw error;

      return res.status(201).json(data);
    }

    if (method === "DELETE") {
      // Clear an order by table number
      const { tableNumber } = req.query;
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("table_number", tableNumber);
      if (error) throw error;

      return res
        .status(200)
        .json({ message: `Order for table ${tableNumber} cleared.` });
    }

    // If method is not supported
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message });
  }
};
