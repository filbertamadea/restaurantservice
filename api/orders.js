const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("orders").select("*");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { tableNumber, orders } = req.body;
    if (!tableNumber || !Array.isArray(orders)) {
      return res.status(400).json({ error: "Invalid table number or orders" });
    }
    const { data, error } = await supabase
      .from("orders")
      .upsert([{ table_number: tableNumber, orders }], {
        onConflict: ["table_number"],
      });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { tableNumber } = req.query;
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("table_number", tableNumber);
    if (error) return res.status(500).json({ error: error.message });
    return res
      .status(200)
      .json({ message: `Order for table ${tableNumber} cleared.` });
  }

  res.status(405).json({ error: "Method not allowed" });
};
