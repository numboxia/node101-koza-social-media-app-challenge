const socket = io();

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const messagesDiv = document.getElementById("messages");

    const currentUserId = document.body.dataset.currentUser;
    const otherUserId = document.body.dataset.otherUser;

    if (!form || !input || !messagesDiv || !otherUserId) return;

    socket.emit("joinRoom", { currentUserId, otherUserId });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const content = input.value.trim();
        if (!content) return;

        appendMessage(content, "me");

        socket.emit("sendMessage", {
            sender: currentUserId,
            receiver: otherUserId,
            content
        });

        input.value = "";
    });

    socket.on("receiveMessage", (data) => {
        if (
            (data.sender === currentUserId && data.receiver === otherUserId) ||
            (data.sender === otherUserId && data.receiver === currentUserId)
        ) {
            appendMessage(data.content, data.sender === currentUserId ? "me" : "them");
        }
    });

    function appendMessage(text, type) {
        const div = document.createElement("div");
        div.className = "message " + type;
        div.textContent = text;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});
