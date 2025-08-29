// public/script.js
(() => {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "login.html"; return; }

  const headers = { "Content-Type": "application/json", Authorization: "Bearer " + token };
  const hello = document.getElementById("helloUser");
  const user = localStorage.getItem("username") || "";
  if (hello) hello.textContent = `Logged in as ${user}`;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  const form = document.getElementById("studentForm");
  const msg = document.getElementById("msg");
  const tbody = document.querySelector("#studentsTable tbody");
  const searchInput = document.getElementById("searchInput");

  let allStudents = [];
  let editingId = null;

  // mapping helpers
  const romanToIntMap = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8 };
  const intToRomanMap = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII' };

  function romanToInt(r) {
    return romanToIntMap[r] || parseInt(r,10) || 0;
  }
  function intToRoman(n) {
    return intToRomanMap[n] || String(n);
  }

  async function fetchStudents() {
    try {
      const res = await fetch("/students", { headers });
      if (res.status === 401) { localStorage.clear(); location.href = "login.html"; return; }
      allStudents = await res.json();
      render(allStudents);
    } catch (e) {
      msg.textContent = "Failed to load students.";
    }
  }

  function render(list) {
    tbody.innerHTML = "";
    list.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.rollNumber)}</td>
        <td>${escapeHtml(s.course)}</td>
        <td>${intToRoman(s.year)}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editStudent(${s.id})">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteStudent(${s.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    // read values from select/listbox for course and year
    const payload = {
      name: document.getElementById("name").value.trim(),
      rollNumber: document.getElementById("rollNumber").value.trim(),
      course: document.getElementById("course").value,           // select value (e.g., "CSE")
      year: romanToInt(document.getElementById("year").value)    // convert "III" -> 3
    };

    if (!payload.name || !payload.rollNumber || !payload.course || !payload.year) {
      msg.textContent = "Fill all fields.";
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/students/${editingId}`, { method: "PUT", headers, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        editingId = null;
      } else {
        const res = await fetch("/students", { method: "POST", headers, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }
      form.reset();
      // reset selects to first option visually
      document.getElementById("course").selectedIndex = 0;
      document.getElementById("year").selectedIndex = 0;
      fetchStudents();
    } catch (e) {
      msg.textContent = e.message;
    }
  });

  // expose functions for inline buttons
  window.editStudent = (id) => {
    const s = allStudents.find(x => x.id === id);
    if (!s) return;
    document.getElementById("name").value = s.name;
    document.getElementById("rollNumber").value = s.rollNumber;

    // set course select to student's course (if not present, add it)
    const courseSel = document.getElementById("course");
    let found = Array.from(courseSel.options).some(opt => {
      if (opt.value === s.course) { opt.selected = true; return true; }
      return false;
    });
    if (!found) {
      const opt = document.createElement("option");
      opt.value = s.course;
      opt.textContent = s.course;
      courseSel.appendChild(opt);
      opt.selected = true;
    }

    // set year select to Roman value
    const yearSel = document.getElementById("year");
    const roman = intToRoman(s.year);
    let fy = Array.from(yearSel.options).some(opt => {
      if (opt.value === roman) { opt.selected = true; return true; }
      return false;
    });
    if (!fy) {
      const opt = document.createElement("option");
      opt.value = roman;
      opt.textContent = roman;
      yearSel.appendChild(opt);
      opt.selected = true;
    }

    editingId = id;
    msg.textContent = "Editing: update fields and press Save.";
  };

  window.deleteStudent = async (id) => {
    if (!confirm("Delete this student?")) return;
    try {
      const res = await fetch(`/students/${id}`, { method: "DELETE", headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchStudents();
    } catch (e) {
      msg.textContent = e.message;
    }
  };

  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = allStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q) ||
      intToRoman(s.year).toLowerCase().includes(q) ||
      String(s.year).includes(q)
    );
    render(filtered);
  });

  function escapeHtml(s) {
    if (!s) return s;
    return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
  }

  // initial load
  fetchStudents();
})();
