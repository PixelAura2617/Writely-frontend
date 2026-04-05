// ================= INIT =================
let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChatId = null;

let freeLimit = parseInt(localStorage.getItem("freeLimit")) || 2;
let firstMessage = localStorage.getItem("firstMessageDone") !== "true";

let messageCount = 0;
let adShown = false;

// ================= DAILY RESET =================
let today = new Date().toDateString();
let lastVisit = localStorage.getItem("lastVisit");

if (lastVisit !== today) {
  freeLimit = 2;
  localStorage.setItem("lastVisit", today);
}

// ================= SAVE =================
function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("freeLimit", freeLimit);
}

// ================= UI =================
function updateLimitUI() {
  let el = document.getElementById("limitCount");
  if (el) el.innerText = freeLimit;
}

// ================= NEW CHAT =================
function newChat() {
  const id = "chat_" + Date.now();
  chats[id] = { title: "New Chat", messages: [] };
  currentChatId = id;
  saveChats();
  renderSidebar();
  renderChat();
}

// ================= DELETE =================
function deleteChat(id) {
  delete chats[id];
  if (currentChatId === id) currentChatId = null;
  saveChats();
  renderSidebar();
  renderChat();
}

// ================= SIDEBAR =================
function renderSidebar() {
  const chatList = document.getElementById("chatList");
  if (!chatList) return;

  chatList.innerHTML = "";

  Object.keys(chats).forEach(id => {
    let div = document.createElement("div");
    div.className = "chat-item";

    let title = document.createElement("span");
    title.innerText = chats[id].title;
    title.onclick = () => {
      currentChatId = id;
      renderChat();
    };

    let del = document.createElement("span");
    del.innerText = "🗑";
    del.style.marginLeft = "10px";
    del.onclick = () => deleteChat(id);

    div.appendChild(title);
    div.appendChild(del);

    chatList.appendChild(div);
  });
}

// ================= CHAT =================
function renderChat() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  chatBox.innerHTML = "";

  if (!currentChatId) return;

  chats[currentChatId].messages.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}

// ================= MESSAGE UI =================
function addMessage(text, sender) {
  const chatBox = document.getElementById("chatBox");

  let div = document.createElement("div");
  div.className = sender;

  let span = document.createElement("span");
  span.innerText = text;

  div.appendChild(span);
  chatBox.appendChild(div);

  chatBox.scrollTop = chatBox.scrollHeight;
  return span;
}

// ================= SEND MESSAGE =================
async function sendMessage() {
  let input = document.getElementById("input");
  let text = input.value.trim();

  if (!text) return;

  // 🎁 FIRST BONUS
  if (firstMessage) {
    firstMessage = false;
    localStorage.setItem("firstMessageDone", "true");
    freeLimit += 1;
  }

  // 🔒 LIMIT
  if (freeLimit <= 0) {
    document.getElementById("limitBox").style.display = "block";
    return;
  }

  // USER ID
  if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", "user_" + Date.now());
  }

  if (!currentChatId) newChat();

  addMessage(text, "user");

  chats[currentChatId].messages.push({
    text,
    sender: "user"
  });

  input.value = "";
  messageCount++;

  let typing = addMessage("Typing...", "bot");

  try {
    let res = await fetch("https://writely-backend-x2y0.onrender.com/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: text,
        userId: localStorage.getItem("userId")
      })
    });

    let data = await res.json();
    typing.innerText = "";

    let reply =
      data.reply ||
      data.text ||
      data?.choices?.[0]?.message?.content ||
      "No response 😅";

    let msgEl = addMessage("", "bot");
    typeText(msgEl, reply);

    chats[currentChatId].messages.push({
      text: reply,
      sender: "bot"
    });

    // 🔥 LIMIT REDUCE
    freeLimit--;
    updateLimitUI();
    saveChats();
    renderSidebar();

    // 💰 AD TRIGGER (2nd message only once)
    if (messageCount === 2 && !adShown) {
      adShown = true;
      setTimeout(() => {
        document.body.click();
      }, 1200);
    }

  } catch (err) {
    typing.innerText = "⚠️ Network error";
  }
}

// ================= 🔥 UNLOCK =================
function watchAd() {

  let joined = localStorage.getItem("joinedTelegram");

  if (!joined) {
    localStorage.setItem("joinedTelegram", "true");
    window.open("https://t.me/prediction999YRGame", "_blank");
    return;
  }

  // ✅ REAL AD CALL
  showAd();

  setTimeout(() => {
    freeLimit += 3;
    saveChats();
    updateLimitUI();
    alert("🚀 Messages unlocked!");
  }, 3000);
}
// ================= VOICE =================
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.start();

  recognition.onresult = function(event) {
    document.getElementById("input").value = event.results[0][0].transcript;
  };
}

// ================= LOAD =================
window.onload = () => {
  renderSidebar();
  updateLimitUI();

  // 🔒 refresh bypass fix
  if (freeLimit <= 0) {
    document.getElementById("limitBox").style.display = "block";
  }
};

// ================= SIDEBAR =================
function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("active");
}

// ================= TYPING =================
function typeText(element, text, speed = 15) {
  let i = 0;
  element.innerHTML = "";

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}
