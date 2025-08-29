// public/login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("errorMsg");
  err.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      err.textContent = data.error || "Login failed";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    window.location.href = "index.html";
  } catch (e) {
    err.textContent = "Network error";
  }
});
