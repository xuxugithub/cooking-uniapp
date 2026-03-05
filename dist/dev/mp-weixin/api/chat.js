"use strict";
const common_vendor = require("../common/vendor.js");
const config_app = require("../config/app.js");
const utils_request = require("../utils/request.js");
const getConversationList = (options = {}) => {
  return utils_request.get("/api/conversation/list", {}, options);
};
const createConversation = (title = "小助手会话", options = {}) => {
  return utils_request.post("/api/conversation/create", { title }, options);
};
const getConversationMessages = (conversationId, options = {}) => {
  return utils_request.get(`/api/conversation/${conversationId}/messages`, {}, options);
};
const saveConversationMessage = (data, options = {}) => {
  return utils_request.post("/api/conversation/message", data, options);
};
const repairUtf8Mojibake = (text) => {
  if (typeof text !== "string" || !/[\u00C0-\u00FF]/.test(text)) {
    return text;
  }
  try {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i) & 255;
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    try {
      return decodeURIComponent(escape(text));
    } catch (e2) {
      return text;
    }
  }
};
const decodeChunkData = (data, decoder) => {
  if (!data)
    return "";
  if (typeof data === "string")
    return repairUtf8Mojibake(data);
  let source = null;
  if (data instanceof ArrayBuffer) {
    source = data;
  } else if (ArrayBuffer.isView(data)) {
    source = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else if (data.buffer instanceof ArrayBuffer) {
    source = data.buffer;
  }
  if (!(source instanceof ArrayBuffer)) {
    return "";
  }
  if (decoder) {
    return decoder.decode(source, { stream: true });
  }
  const bytes = new Uint8Array(source);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  try {
    return decodeURIComponent(escape(binary));
  } catch (e) {
    return binary;
  }
};
const parseSseEvent = (rawEvent) => {
  const lines = rawEvent.split("\n");
  let eventName = "message";
  const dataLines = [];
  lines.forEach((line) => {
    const normalizedLine = line.replace(/^\uFEFF/, "");
    if (normalizedLine.startsWith("event:")) {
      eventName = normalizedLine.slice(6).trim() || "message";
      return;
    }
    if (normalizedLine.startsWith("data:")) {
      dataLines.push(normalizedLine.slice(5).trimStart());
    }
  });
  return {
    eventName,
    data: dataLines.join("\n")
  };
};
const parseSseTextFallback = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    return [];
  }
  const normalized = rawText.replace(/\r/g, "");
  const events = [];
  const blocks = normalized.split("\n\n");
  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed)
      return;
    const parsed = parseSseEvent(trimmed);
    if (parsed.data) {
      events.push(parsed);
      return;
    }
    const dataLines = trimmed.split("\n").filter((line) => line.replace(/^\uFEFF/, "").startsWith("data:")).map((line) => line.replace(/^\uFEFF/, "").slice(5).trimStart());
    if (dataLines.length > 0) {
      events.push({
        eventName: "message",
        data: dataLines.join("\n")
      });
    }
  });
  return events;
};
const extractTextPayload = (payload, decoder) => {
  if (!payload)
    return "";
  if (typeof payload === "string")
    return repairUtf8Mojibake(payload);
  if (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)) {
    return decodeChunkData(payload, decoder);
  }
  if (typeof payload === "object") {
    if (typeof payload.data === "string")
      return repairUtf8Mojibake(payload.data);
    if (payload.data instanceof ArrayBuffer || ArrayBuffer.isView(payload.data)) {
      return decodeChunkData(payload.data, decoder);
    }
    if (typeof payload.content === "string")
      return repairUtf8Mojibake(payload.content);
  }
  return "";
};
const streamChat = (question, conversationId, handlers = {}, options = {}) => {
  const token = common_vendor.index.getStorageSync("token") || "";
  const url = `${config_app.API_BASE_URL}/api/chat/stream`;
  const decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8") : null;
  const {
    onMessage,
    onComplete,
    onError
  } = handlers;
  let requestTask = null;
  let settled = false;
  let isCompleted = false;
  let fullContent = "";
  let sseBuffer = "";
  let chunkReceived = false;
  let successReturned = false;
  let finalizeTimer = null;
  const resolveOrReject = (fn, payload) => {
    if (settled)
      return;
    settled = true;
    if (finalizeTimer) {
      clearTimeout(finalizeTimer);
      finalizeTimer = null;
    }
    fn(payload);
  };
  const promise = new Promise((resolve, reject) => {
    const resolveOnce = (payload) => resolveOrReject(resolve, payload);
    const rejectOnce = (error) => resolveOrReject(reject, error);
    const scheduleFinalize = (delay = 1200) => {
      if (finalizeTimer) {
        clearTimeout(finalizeTimer);
      }
      finalizeTimer = setTimeout(() => {
        if (settled)
          return;
        flushSseBuffer(true);
        if (settled)
          return;
        if (fullContent) {
          resolveOnce({
            content: fullContent,
            completePayload: ""
          });
          return;
        }
        rejectOnce(new Error("stream empty response"));
      }, delay);
    };
    const handleEvent = (eventName, data) => {
      console.log("[stream] handleEvent:", eventName, data);
      if (eventName === "message") {
        if (!data)
          return;
        fullContent += data;
        if (typeof onMessage === "function") {
          onMessage(data, fullContent);
        }
        return;
      }
      if (eventName === "complete") {
        isCompleted = true;
        if (typeof onComplete === "function") {
          onComplete(data, fullContent);
        }
        resolveOnce({
          content: fullContent,
          completePayload: data
        });
        return;
      }
      if (eventName === "error") {
        const errorMessage = data || "stream chat failed";
        if (typeof onError === "function") {
          onError(errorMessage, fullContent);
        }
        rejectOnce(new Error(errorMessage));
      }
    };
    const flushSseBuffer = (force = false) => {
      let normalizedBuffer = sseBuffer.replace(/\r/g, "");
      let separatorIndex = normalizedBuffer.indexOf("\n\n");
      while (separatorIndex >= 0) {
        const rawEvent = normalizedBuffer.slice(0, separatorIndex).trim();
        normalizedBuffer = normalizedBuffer.slice(separatorIndex + 2);
        if (rawEvent) {
          const event = parseSseEvent(rawEvent);
          handleEvent(event.eventName, event.data);
        }
        separatorIndex = normalizedBuffer.indexOf("\n\n");
      }
      sseBuffer = normalizedBuffer;
      if (force && sseBuffer.trim()) {
        const pending = sseBuffer.trim();
        sseBuffer = "";
        const event = parseSseEvent(pending);
        if (event.data) {
          handleEvent(event.eventName, event.data);
          return;
        }
        const fallbackEvents = parseSseTextFallback(pending);
        fallbackEvents.forEach((evt) => {
          handleEvent(evt.eventName, evt.data);
        });
      }
    };
    requestTask = common_vendor.index.request({
      url,
      method: "POST",
      data: {
        question,
        conversationId,
        stream: true
      },
      timeout: options.timeout || 7e4,
      enableChunked: true,
      header: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        token,
        ...options.header || {}
      },
      success: (res) => {
        if (settled)
          return;
        successReturned = true;
        if (res.statusCode !== 200) {
          rejectOnce(new Error(`request failed ${res.statusCode}`));
          return;
        }
        if (res.data && typeof res.data === "object" && Object.prototype.hasOwnProperty.call(res.data, "code") && Number(res.data.code) !== 200) {
          rejectOnce(new Error(res.data.message || "request failed"));
          return;
        }
        sseBuffer += extractTextPayload(res.data, decoder);
        flushSseBuffer(true);
        if (settled) {
          return;
        }
        if (!chunkReceived) {
          scheduleFinalize(1500);
          return;
        }
        scheduleFinalize(400);
      },
      fail: (error) => {
        if (settled)
          return;
        rejectOnce(new Error((error == null ? void 0 : error.errMsg) || "network error"));
      }
    });
    if (requestTask && typeof requestTask.onChunkReceived === "function") {
      requestTask.onChunkReceived((event) => {
        if (settled)
          return;
        chunkReceived = true;
        console.log("[stream] onChunkReceived fired", event);
        const rawChunk = event && Object.prototype.hasOwnProperty.call(event, "data") ? event.data : event;
        const chunkText = extractTextPayload(rawChunk, decoder);
        console.log("[stream] chunkText:", chunkText);
        if (!chunkText)
          return;
        sseBuffer += chunkText;
        flushSseBuffer(false);
        if (successReturned && !settled) {
          scheduleFinalize(400);
        }
      });
    }
    if (requestTask && typeof requestTask.onHeadersReceived === "function") {
      requestTask.onHeadersReceived((headersRes) => {
        if (settled || !headersRes)
          return;
        if (Number(headersRes.statusCode) === 401) {
          rejectOnce(new Error("please login first"));
        }
      });
    }
  });
  promise.abort = () => {
    if (finalizeTimer) {
      clearTimeout(finalizeTimer);
      finalizeTimer = null;
    }
    if (!requestTask || settled || isCompleted) {
      return;
    }
    requestTask.abort();
  };
  return promise;
};
exports.createConversation = createConversation;
exports.getConversationList = getConversationList;
exports.getConversationMessages = getConversationMessages;
exports.saveConversationMessage = saveConversationMessage;
exports.streamChat = streamChat;
