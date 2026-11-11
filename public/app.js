const STORAGE_KEY = "slayer-ai-chats-v1";
const chats = loadChats();
let activeChatId = chats[0]?.id ?? null;
let isSending = false;

const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const chatList = document.getElementById("chatList");
const welcome = document.getElementById("welcome");
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

function loadChats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((chat) =>
      chat && typeof chat.id === "string" && Array.isArray(chat.messages)
    ) : [];
  } catch {
    return [];
  }
}

function saveChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    showToast("Suhbatlarni brauzerda saqlab bo‘lmadi.");
  }
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    Object.assign(toast.style, {
      position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)",
      zIndex: "10", padding: "10px 14px", borderRadius: "10px", background: "#3a3a3a",
      color: "white", fontSize: "12px", boxShadow: "0 4px 18px #0005"
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2800);
}

function newChat() {
  const chat = { id: crypto.randomUUID(), title: "Yangi suhbat", messages: [] };
  chats.unshift(chat);
  activeChatId = chat.id;
  saveChats();
  render();
  closeSidebar();
  messageInput.focus();
}

function activeChat() {
  return chats.find((chat) => chat.id === activeChatId);
}

function renderChatList() {
  chatList.replaceChildren();
  chats.forEach((chat) => {
    const button = document.createElement("button");
    button.className = "chat-item" + (chat.id === activeChatId ? " active" : "");
    button.type = "button";
    const icon = document.createElement("span");
    icon.className = "chat-item-icon";
    icon.textContent = "▤";
    const title = document.createElement("span");
    title.className = "chat-item-title";
    title.textContent = chat.title || "Yangi suhbat";
    button.append(icon, title);
    button.addEventListener("click", () => {
      activeChatId = chat.id;
      render();
      closeSidebar();
    });
    chatList.appendChild(button);
  });
}

function addMessage(role, text, options = {}) {
  const row = document.createElement("article");
  row.className = `message ${role}${options.error ? " error" : ""}`;
  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "assistant-avatar";
    avatar.textContent = "✳";
    row.appendChild(avatar);
  }
  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;
  row.appendChild(content);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return row;
}

function renderMessages() {
  const chat = activeChat();
  const hasMessages = Boolean(chat?.messages.length);
  welcome.hidden = hasMessages;
  messages.hidden = !hasMessages;
  messages.replaceChildren();
  if (!hasMessages) return;
  chat.messages.forEach((message) => addMessage(message.role, message.content));
}

function render() {
  renderChatList();
  renderMessages();
}

function setSending(sending) {
  isSending = sending;
  sendButton.disabled = sending || !messageInput.value.trim();
  messageInput.disabled = sending;
  sendButton.textContent = sending ? "…" : "↑";
}

async function sendMessage(event) {
  event?.preventDefault();
  const text = messageInput.value.trim();
  if (!text || isSending) return;

  if (!activeChat()) {
    const chat = { id: crypto.randomUUID(), title: "Yangi suhbat", messages: [] };
    chats.unshift(chat);
    activeChatId = chat.id;
  }

  const chat = activeChat();
  if (!chat.messages.length) chat.title = text.length > 34 ? `${text.slice(0, 34)}…` : text;
  chat.messages.push({ role: "user", content: text });
  messageInput.value = "";
  resizeInput();
  setSending(true);
  saveChats();
  render();

  const typingRow = document.createElement("article");
  typingRow.className = "message assistant";
  const avatar = document.createElement("div");
  avatar.className = "assistant-avatar";
  avatar.textContent = "✳";
  const dots = document.createElement("div");
  dots.className = "typing";
  dots.setAttribute("aria-label", "Slayer AI javob yozmoqda");
  dots.innerHTML = "<i></i><i></i><i></i>";
  typingRow.append(avatar, dots);
  if (activeChatId === chat.id) {
    welcome.hidden = true;
    messages.hidden = false;
    messages.appendChild(typingRow);
    messages.scrollTop = messages.scrollHeight;
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chat.messages.map(({ role, content }) => ({ role, content })) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "So‘rov bajarilmadi.");
    if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("AI bo‘sh javob qaytardi.");
    chat.messages.push({ role: "assistant", content: data.reply.trim() });
    saveChats();
  } catch (error) {
    const errorText = error.message.includes("Failed to fetch")
      ? "Serverga ulanib bo‘lmadi. Saytni server orqali ochayotganingizni tekshiring."
      : error.message;
    chat.messages.push({ role: "assistant", content: errorText, error: true });
    saveChats();
  } finally {
    setSending(false);
    renderChatList();
    if (activeChatId === chat.id) renderMessages();
    messageInput.focus();
  }
}

function resizeInput() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 180)}px`;
  sendButton.disabled = isSending || !messageInput.value.trim();
}

function openSidebar() {
  sidebar.classList.add("open");
  backdrop.classList.add("visible");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("visible");
}

document.getElementById("newChat").addEventListener("click", newChat);
document.getElementById("chatForm").addEventListener("submit", sendMessage);
document.getElementById("openSidebar").addEventListener("click", openSidebar);
document.getElementById("closeSidebar").addEventListener("click", closeSidebar);
backdrop.addEventListener("click", closeSidebar);
messageInput.addEventListener("input", resizeInput);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    document.getElementById("chatForm").requestSubmit();
  }
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.prompt || "";
    resizeInput();
    document.getElementById("chatForm").requestSubmit();
  });
});

document.getElementById("shareButton").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    showToast("Sahifa havolasi nusxalandi.");
  } catch {
    showToast("Havolani nusxalash imkoni bo‘lmadi.");
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    newChat();
  }
  if (event.key === "Escape") closeSidebar();
});

render();
