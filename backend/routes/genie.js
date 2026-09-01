// import express from "express";
// import {
//   startGenieConversation,
//   sendGenieMessage
// } from "../services/genieService.js";

// const router = express.Router();

// router.post("/genie", async (req, res) => {
//   try {
//     const { query, conversationId } = req.body;

//     if (!query || typeof query !== "string") {
//       return res.status(400).json({
//         error: "query is required"
//       });
//     }

//     let result;

//     if (conversationId) {
//       result = await sendGenieMessage(conversationId, query);
//     } else {
//       result = await startGenieConversation(query);
//     }

//     console.log("Genie response:", JSON.stringify(result, null, 2));

//     res.json(result);
//   } catch (error) {
//     console.error("Genie error:", error);

//     res.status(500).json({
//       error: error.message
//     });
//   }
// });

// export default router;

import express from "express";
import { startGenieConversation, sendGenieMessage } from "../services/genieService.js";

const router = express.Router();

router.post("/genie", async (req, res) => {
  try {
    const { query, conversationId } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }

    const result = conversationId
      ? await sendGenieMessage(conversationId, query)
      : await startGenieConversation(query);

    res.json(result);
  } catch (error) {
    console.error("Genie error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;