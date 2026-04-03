// ================= INIT =================
let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChatId = null;

let freeLimit = parseInt(localStorage.getItem("freeLimit")) || 3;

// ================= SAVE =================
function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("freeLimit", freeLimit);
}

// ================= LIMIT UI =================
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

// ================= DELETE CHAT =================
function deleteChat(id) {
  delete chats[id];

  if (currentChatId === id) {
    currentChatId = null;
  }

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

    let menuBtn = document.createElement("span");
    menuBtn.innerText = "⋮";
    menuBtn.className = "menu-btn";

    menuBtn.onclick = (e) => toggleMenu(e, id);

    let menu = document.createElement("div");
    menu.className = "menu-dropdown";
    menu.id = "menu-" + id;

    let del = document.createElement("div");
    del.innerText = "Delete";
    del.onclick = () => deleteChat(id);

    menu.appendChild(del);

    div.appendChild(title);
    div.appendChild(menuBtn);
    div.appendChild(menu);

    chatList.appendChild(div);
  });
}

// ================= RENDER CHAT =================
function renderChat() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  chatBox.innerHTML = "";

  if (!currentChatId) return;

  chats[currentChatId].messages.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}

// ================= ADD MESSAGE =================
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

  // 🔥 LIMIT CHECK (OGAds show)
  if (freeLimit <= 0) {
    document.querySelector('[data-captcha-enable]').style.display = "block";
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

  let typing = addMessage("Thinking...", "bot");

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

    reply = reply.trim() || "Server waking up...";

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

  } catch (err) {
    console.log(err);
    typing.innerText = "⚠️ Network error";
  }
}

// ================= WATCH AD (BUTTON) =================
function watchAd() {
  document.querySelector('[data-captcha-enable]').style.display = "block";
}
// ================= OGAds UNLOCK =================
function og_converted() {
  freeLimit += 5; // reward

  localStorage.setItem("freeLimit", freeLimit);

  document.querySelector('[data-captcha-enable]').style.display = "none";

  updateLimitUI();

  alert("🚀 5 Messages Unlocked!");
}

// ================= MENU =================
function toggleMenu(e, id) {
  e.stopPropagation();

  document.querySelectorAll(".menu-dropdown").forEach(m => {
    m.style.display = "none";
  });

  let menu = document.getElementById("menu-" + id);
  menu.style.display = "block";
}

document.body.addEventListener("click", () => {
  document.querySelectorAll(".menu-dropdown").forEach(m => {
    m.style.display = "none";
  });
});

// ================= PROFILE =================
function openProfile() {
  window.location.href = "profile.html";
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

// ================= VOICE =================
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = "en-IN";
  recognition.start();

  recognition.onresult = function(event) {
    document.getElementById("input").value = event.results[0][0].transcript;
  };

  recognition.onerror = function() {
    alert("Voice error");
  };
}

// ================= LOAD =================
window.onload = () => {
  renderSidebar();
  updateLimitUI();
};
function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("active");
}

// ================= TYPING EFFECT =================
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
