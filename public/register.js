// public/register.js
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("regMsg");
  msg.textContent = "";

  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || "Registration failed";
      return;
    }

    // Save token and go to app
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    window.location.href = "index.html";
  } catch {
    msg.textContent = "Network error";
  }
});
