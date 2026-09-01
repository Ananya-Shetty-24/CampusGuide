// const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
// const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
// const GENIE_SPACE_ID = process.env.GENIE_SPACE_ID;

// function requireConfig() {
//   if (!DATABRICKS_HOST) {
//     throw new Error("DATABRICKS_HOST is not configured");
//   }

//   if (!DATABRICKS_TOKEN) {
//     throw new Error("DATABRICKS_TOKEN is not configured");
//   }

//   if (!GENIE_SPACE_ID) {
//     throw new Error("GENIE_SPACE_ID is not configured");
//   }
// }

// async function databricksFetch(path, options = {}) {
//   requireConfig();

//   const response = await fetch(
//     `${DATABRICKS_HOST}${path}`,
//     {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${DATABRICKS_TOKEN}`,
//         ...(options.headers || {})
//       }
//     }
//   );

//   const text = await response.text();

//   let data;

//   try {
//     data = JSON.parse(text);
//   } catch {
//     data = { raw: text };
//   }

//   if (!response.ok) {
//     throw new Error(
//       `Databricks Genie API ${response.status}: ${JSON.stringify(data)}`
//     );
//   }

//   return data;
// }

// export async function startGenieConversation(query) {
//   const result = await databricksFetch(
//     `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/start-conversation`,
//     {
//       method: "POST",
//       body: JSON.stringify({
//         content: query
//       })
//     }
//   );

//   if (result.status === "SUBMITTED" || result.status === "IN_PROGRESS") {
//     const conversationId = result.conversation_id || result.conversation?.id;
//     if (conversationId) {
//       const messages = await waitForMessages(conversationId);
//       return { ...result, messages };
//     }
//   }

//   return result;
// }

// async function waitForMessages(conversationId, maxAttempts = 20, intervalMs = 2000) {
//   for (let i = 0; i < maxAttempts; i++) {
//     await sleep(intervalMs);
//     try {
//       console.log(`Polling attempt ${i + 1} for conversation ${conversationId}`);
//       const messagesResult = await databricksFetch(
//         `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conversationId}/messages`
//       );
//       console.log(`Messages result (attempt ${i + 1}):`, JSON.stringify(messagesResult, null, 2));

//       const messages = messagesResult.messages || [];
//       console.log(`Parsed messages (attempt ${i + 1}):`, JSON.stringify(messages, null, 2));

//       const completedMsg = messages.find((m) => m.status === "COMPLETED" && (m.content || (m.attachments && m.attachments.length > 0)));
//       console.log(`Completed message found:`, completedMsg ? "YES" : "NO");

//       if (completedMsg) {
//         return messages;
//       }
//     } catch (e) {
//       console.error(`Polling attempt ${i + 1} failed:`, e.message);
//     }
//   }
//   console.log("Polling exhausted, returning empty messages");
//   return [];
// }

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// export async function sendGenieMessage(conversationId, query) {
//   const result = await databricksFetch(
//     `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conversationId}/messages`,
//     {
//       method: "POST",
//       body: JSON.stringify({
//         content: query
//       })
//     }
//   );

//   if (result.status === "SUBMITTED" || result.status === "IN_PROGRESS") {
//     const messages = await waitForMessages(conversationId);
//     return { ...result, messages };
//   }

//   return result;
// }

// export { GENIE_SPACE_ID };

// const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
// const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
// const GENIE_SPACE_ID = process.env.GENIE_SPACE_ID;

// function requireConfig() {
//   if (!DATABRICKS_HOST) {
//     throw new Error("DATABRICKS_HOST is not configured");
//   }
//   if (!DATABRICKS_TOKEN) {
//     throw new Error("DATABRICKS_TOKEN is not configured");
//   }
//   if (!GENIE_SPACE_ID) {
//     throw new Error("GENIE_SPACE_ID is not configured");
//   }
// }

// async function databricksFetch(path, options = {}) {
//   requireConfig();

//   const response = await fetch(`${DATABRICKS_HOST}${path}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${DATABRICKS_TOKEN}`,
//       ...(options.headers || {})
//     }
//   });

//   const text = await response.text();

//   let data;
//   try {
//     data = JSON.parse(text);
//   } catch {
//     data = { raw: text };
//   }

//   if (!response.ok) {
//     throw new Error(`Databricks Genie API ${response.status}: ${JSON.stringify(data)}`);
//   }

//   return data;
// }

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// // Pulls the status out of a Genie response, whether it's nested under
// // `message.status` (start-conversation / send-message responses) or sitting
// // at the top level (some polling responses put it there instead).
// function getStatus(result) {
//   return result?.message?.status || result?.status;
// }

// function getConversationId(result) {
//   return result?.conversation_id || result?.conversation?.id;
// }

// async function waitForMessages(conversationId, maxAttempts = 20, intervalMs = 2000) {
//   for (let i = 0; i < maxAttempts; i++) {
//     await sleep(intervalMs);

//     try {
//       const messagesResult = await databricksFetch(
//         `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conversationId}/messages`
//       );

//       const messages = messagesResult.messages || [];

//       const completedMsg = messages.find(
//         (m) => m.status === "COMPLETED" && (m.content || (m.attachments && m.attachments.length > 0))
//       );

//       const failedMsg = messages.find((m) => m.status === "FAILED" || m.status === "CANCELLED");

//       if (completedMsg) {
//         return messages;
//       }

//       if (failedMsg) {
//         console.error(`Genie message ${failedMsg.id} ended with status ${failedMsg.status}`);
//         return messages;
//       }
//     } catch (e) {
//       console.error(`Polling attempt ${i + 1} for conversation ${conversationId} failed:`, e.message);
//     }
//   }

//   console.warn(`Polling exhausted for conversation ${conversationId} with no COMPLETED message`);
//   return [];
// }

// export async function startGenieConversation(query) {
//   const result = await databricksFetch(
//     `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/start-conversation`,
//     {
//       method: "POST",
//       body: JSON.stringify({ content: query })
//     }
//   );

//   const status = getStatus(result);
//   const conversationId = getConversationId(result);

//   if ((status === "SUBMITTED" || status === "IN_PROGRESS") && conversationId) {
//     const messages = await waitForMessages(conversationId);
//     return { ...result, messages };
//   }

//   return result;
// }

// export async function sendGenieMessage(conversationId, query) {
//   const result = await databricksFetch(
//     `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conversationId}/messages`,
//     {
//       method: "POST",
//       body: JSON.stringify({ content: query })
//     }
//   );

//   const status = getStatus(result);

//   if (status === "SUBMITTED" || status === "IN_PROGRESS") {
//     const messages = await waitForMessages(conversationId);
//     return { ...result, messages };
//   }

//   return result;
// }

// export { GENIE_SPACE_ID };




const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const GENIE_SPACE_ID = process.env.GENIE_SPACE_ID;

function requireConfig() {
  if (!DATABRICKS_HOST) {
    throw new Error("DATABRICKS_HOST is not configured");
  }
  if (!DATABRICKS_TOKEN) {
    throw new Error("DATABRICKS_TOKEN is not configured");
  }
  if (!GENIE_SPACE_ID) {
    throw new Error("GENIE_SPACE_ID is not configured");
  }
}

async function databricksFetch(path, options = {}) {
  requireConfig();

  const response = await fetch(`${DATABRICKS_HOST}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DATABRICKS_TOKEN}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Databricks Genie API ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pulls the status out of a Genie response, whether it's nested under
// `message.status` (start-conversation / send-message responses) or sitting
// at the top level (some polling responses put it there instead).
function getStatus(result) {
  return result?.message?.status || result?.status;
}

function getConversationId(result) {
  return result?.conversation_id || result?.conversation?.id;
}

function getMessageId(result) {
  return result?.message?.id || result?.message_id;
}

// Polls the conversation's message list until the SPECIFIC message we just
// sent (targetMessageId) reaches a terminal status. We must match on the
// exact message id rather than "the first COMPLETED message in the list" —
// a conversation accumulates every prior message, so using .find() on status
// alone keeps returning the oldest completed message instead of the newest
// one, which is why answers appeared to lag one question behind.
async function waitForMessages(conversationId, targetMessageId, maxAttempts = 20, intervalMs = 2000) {
  if (!targetMessageId) {
    console.warn(`waitForMessages called without a targetMessageId for conversation ${conversationId}`);
    return [];
  }

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);

    try {
      const messagesResult = await databricksFetch(
        `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conversationId}/messages`
      );

      const messages = messagesResult.messages || [];

      const targetMsg = messages.find(
        (m) => m.id === targetMessageId || m.message_id === targetMessageId
      );

      if (!targetMsg) {
        continue;
      }

      const isComplete =
        targetMsg.status === "COMPLETED" &&
        (targetMsg.content || (targetMsg.attachments && targetMsg.attachments.length > 0));

      if (isComplete) {
        return messages;
      }

      if (targetMsg.status === "FAILED" || targetMsg.status === "CANCELLED") {
        console.error(`Genie message ${targetMessageId} ended with status ${targetMsg.status}`);
        return messages;
      }
    } catch (e) {
      console.error(`Polling attempt ${i + 1} for conversation ${conversationId} failed:`, e.message);
    }
  }

  console.warn(
    `Polling exhausted for conversation ${conversationId}, message ${targetMessageId} never completed`
  );
  return [];
}

export async function startGenieConversation(query) {
  const result = await databricksFetch(
    `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/start-conversation`,
    {
      method: "POST",
      body: JSON.stringify({ content: query })
    }
  );

  const status = getStatus(result);
  const conversationId = getConversationId(result);
  const messageId = getMessageId(result);

  if ((status === "SUBMITTED" || status === "IN_PROGRESS") && conversationId && messageId) {
    const messages = await waitForMessages(conversationId, messageId);
    return { ...result, messages };
  }

  return result;
}

export async function sendGenieMessage(conversationId, query) {
  const result = await databricksFetch(
    `/api/2.0/genie/spaces/${GENIE_SPACE_ID}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content: query })
    }
  );

  const status = getStatus(result);
  const messageId = getMessageId(result);

  if ((status === "SUBMITTED" || status === "IN_PROGRESS") && messageId) {
    const messages = await waitForMessages(conversationId, messageId);
    return { ...result, messages };
  }

  return result;
}

export { GENIE_SPACE_ID };