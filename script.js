(function () {
  "use strict";

  /* Constants */
  const STORAGE_KEY = "cgpa_ledger_state_v1";

  const GRADE_SCALE = [
    { grade: "A+", point: 4.00, range: "80-100" },
    { grade: "A",  point: 3.75, range: "75-79" },
    { grade: "A-", point: 3.50, range: "70-74" },
    { grade: "B+", point: 3.25, range: "65-69" },
    { grade: "B",  point: 3.00, range: "60-64" },
    { grade: "B-", point: 2.75, range: "55-59" },
    { grade: "C+", point: 2.50, range: "50-54" },
    { grade: "C",  point: 2.25, range: "45-49" },
    { grade: "D",  point: 2.00, range: "40-44" },
    { grade: "F",  point: 0.00, range: "0-39" },
  ];
  const GRADE_POINTS = Object.fromEntries(GRADE_SCALE.map(g => [g.grade, g.point]));


  /* State */
  
  function blankCourse() {
    return { id: cryptoId(), name: "", credit: "", grade: "" };
  }

  function defaultState() {
    return {
      student: { name: "", id: "", dept: "" },
      semesters: [],           // [{id, name, courses:[{id,name,credit,grade}]}]
      draft: { editingId: null, name: "", courses: [blankCourse()] },
      theme: "light",
    };
  }

  let state = loadState();

  function cryptoId() {
    return "c_" + Math.random().toString(36).slice(2, 10);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // basic shape guard
      if (!parsed.draft || !Array.isArray(parsed.semesters)) return defaultState();
      if (!parsed.draft.courses || parsed.draft.courses.length === 0) {
        parsed.draft.courses = [blankCourse()];
      }
      return parsed;
    } catch (e) {
      console.warn("Could not read saved data, starting fresh.", e);
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save data locally.", e);
    }
  }


  /* Calculations */
  
  function courseQualityPoints(course) {
    const credit = parseFloat(course.credit);
    const point = GRADE_POINTS[course.grade];
    if (isNaN(credit) || point === undefined) return 0;
    return credit * point;
  }

  function courseIsValid(course) {
    const credit = parseFloat(course.credit);
    return !isNaN(credit) && credit > 0 && GRADE_POINTS[course.grade] !== undefined;
  }

  function semesterStats(courses) {
    let credits = 0;
    let quality = 0;
    courses.forEach(c => {
      if (!courseIsValid(c)) return;
      const credit = parseFloat(c.credit);
      credits += credit;
      quality += courseQualityPoints(c);
    });
    const gpa = credits > 0 ? quality / credits : 0;
    return { credits, quality, gpa };
  }

  function savedSemestersStats(excludeId) {
    let credits = 0;
    let quality = 0;
    state.semesters.forEach(s => {
      if (excludeId && s.id === excludeId) return;
      const stats = semesterStats(s.courses);
      credits += stats.credits;
      quality += stats.quality;
    });
    return { credits, quality };
  }

  function overallStatsIncludingDraft() {
    const saved = savedSemestersStats(state.draft.editingId);
    const draft = semesterStats(state.draft.courses);
    const credits = saved.credits + draft.credits;
    const quality = saved.quality + draft.quality;
    const gpa = credits > 0 ? quality / credits : 0;
    return { credits, quality, gpa };
  }


  /* Rendering: Course table */
  
  const courseBody = document.getElementById("courseBody");
  const gradeOptionsHtml = ['<option value="">—</option>']
    .concat(GRADE_SCALE.map(g => `<option value="${g.grade}">${g.grade}</option>`))
    .join("");

  function renderCourses() {
    courseBody.innerHTML = "";
    state.draft.courses.forEach(course => {
      const tr = document.createElement("tr");
      tr.dataset.id = course.id;

      const point = GRADE_POINTS[course.grade];
      const qp = courseIsValid(course) ? courseQualityPoints(course) : 0;

      tr.innerHTML = `
        <td class="col-name">
          <input type="text" class="course-name" placeholder="e.g. Data Structures" value="${escapeAttr(course.name)}" />
        </td>
        <td class="col-credit">
          <input type="number" class="course-credit" min="0" max="9" step="0.5" placeholder="3" value="${escapeAttr(course.credit)}" />
        </td>
        <td class="col-grade">
          <select class="course-grade">${gradeOptionsHtml}</select>
        </td>
        <td class="col-point point-cell">${point !== undefined ? point.toFixed(2) : "—"}</td>
        <td class="col-quality quality-cell">${courseIsValid(course) ? qp.toFixed(2) : "—"}</td>
        <td class="col-remove">
          <button class="remove-row" title="Remove subject" aria-label="Remove subject">✕</button>
        </td>
      `;

      tr.querySelector(".course-grade").value = course.grade;

      tr.querySelector(".course-name").addEventListener("input", e => {
        course.name = e.target.value;
        saveState();
      });
      tr.querySelector(".course-credit").addEventListener("input", e => {
        course.credit = e.target.value;
        saveState();
        renderCourses();
        renderAll(false);
      });
      tr.querySelector(".course-grade").addEventListener("change", e => {
        course.grade = e.target.value;
        saveState();
        renderCourses();
        renderAll(false);
      });
      tr.querySelector(".remove-row").addEventListener("click", () => {
        state.draft.courses = state.draft.courses.filter(c => c.id !== course.id);
        if (state.draft.courses.length === 0) state.draft.courses.push(blankCourse());
        saveState();
        renderCourses();
        renderAll(true);
      });

      courseBody.appendChild(tr);
    });
  }

  function escapeAttr(v) {
    return String(v ?? "").replace(/"/g, "&quot;");
  }

  document.getElementById("addRowBtn").addEventListener("click", () => {
    state.draft.courses.push(blankCourse());
    saveState();
    renderCourses();
  });

  document.getElementById("resetCurrentBtn").addEventListener("click", () => {
    if (!confirm("Clear the current semester ledger? This won't touch your saved semesters.")) return;
    state.draft.name = "";
    state.draft.editingId = null;
    state.draft.courses = [blankCourse()];
    document.getElementById("semesterName").value = "";
    saveState();
    renderCourses();
    renderAll(true);
  });


  /* Semester name + editing badge */
  
  const semesterNameInput = document.getElementById("semesterName");
  semesterNameInput.addEventListener("input", e => {
    state.draft.name = e.target.value;
    saveState();
  });

  function renderEditingBadge() {
    const badge = document.getElementById("editingBadge");
    if (state.draft.editingId) {
      badge.textContent = "Editing saved semester";
      badge.className = "badge badge--active";
    } else {
      badge.textContent = "New semester";
      badge.className = "badge badge--muted";
    }
  }


  /* Save / edit / delete semester */
  
  document.getElementById("saveSemesterBtn").addEventListener("click", () => {
    const validCourses = state.draft.courses.filter(courseIsValid);
    if (validCourses.length === 0) {
      alert("Add at least one subject with a credit value and a grade before saving.");
      return;
    }
    const name = state.draft.name.trim() || `Semester ${state.semesters.length + 1}`;

    const record = {
      id: state.draft.editingId || cryptoId(),
      name,
      courses: state.draft.courses
        .filter(courseIsValid)
        .map(c => ({ id: c.id, name: c.name.trim() || "Untitled subject", credit: c.credit, grade: c.grade })),
    };

    const existingIndex = state.semesters.findIndex(s => s.id === record.id);
    if (existingIndex >= 0) {
      state.semesters[existingIndex] = record;
    } else {
      state.semesters.push(record);
    }

    state.draft = { editingId: null, name: "", courses: [blankCourse()] };
    semesterNameInput.value = "";

    saveState();
    renderCourses();
    renderAll(true);
  });

  function editSemester(id) {
    const record = state.semesters.find(s => s.id === id);
    if (!record) return;
    state.draft = {
      editingId: id,
      name: record.name,
      courses: record.courses.map(c => ({ ...c })),
    };
    semesterNameInput.value = record.name;
    saveState();
    renderCourses();
    renderAll(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteSemester(id) {
    const record = state.semesters.find(s => s.id === id);
    if (!record) return;
    if (!confirm(`Delete "${record.name}"? This removes it from your CGPA permanently.`)) return;
    state.semesters = state.semesters.filter(s => s.id !== id);
    if (state.draft.editingId === id) {
      state.draft = { editingId: null, name: "", courses: [blankCourse()] };
      semesterNameInput.value = "";
    }
    saveState();
    renderCourses();
    renderAll(true);
  }

  function renderSemesterList() {
    const list = document.getElementById("semesterList");
    const emptyNote = document.getElementById("semesterEmptyNote");
    list.innerHTML = "";

    if (state.semesters.length === 0) {
      list.appendChild(emptyNote);
      return;
    }

    state.semesters.forEach(s => {
      const stats = semesterStats(s.courses);
      const card = document.createElement("div");
      card.className = "semester-card";
      card.innerHTML = `
        <div>
          <div class="semester-card__name">${escapeHtml(s.name)}</div>
          <div class="semester-card__meta">
            <span>${s.courses.length} subject${s.courses.length === 1 ? "" : "s"}</span>
            <span>${stats.credits} credits</span>
            <span>GPA ${stats.gpa.toFixed(2)}</span>
          </div>
        </div>
        <div class="semester-card__actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn danger">Delete</button>
        </div>
      `;
      card.querySelector(".edit-btn").addEventListener("click", () => editSemester(s.id));
      card.querySelector(".delete-btn").addEventListener("click", () => deleteSemester(s.id));
      list.appendChild(card);
    });
  }

  function escapeHtml(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }


  /* Summary + seal */
  
  let lastOverall = 0;

  function renderSummary() {
    const draftStats = semesterStats(state.draft.courses);
    const savedStats = savedSemestersStats(state.draft.editingId);
    const overall = overallStatsIncludingDraft();

    document.getElementById("semCredits").textContent = draftStats.credits;
    document.getElementById("semGpa").textContent = draftStats.gpa.toFixed(2);

    document.getElementById("sumSemesterCount").textContent = state.semesters.length;
    document.getElementById("sumTotalCredits").textContent = savedStats.credits;
    document.getElementById("sumSemGpa").textContent = draftStats.gpa.toFixed(2);
    document.getElementById("sumOverallCgpa").textContent = overall.gpa.toFixed(2);

    document.getElementById("overallCgpaValue").textContent = overall.gpa.toFixed(2);

    if (Math.abs(overall.gpa - lastOverall) > 0.001) {
      const seal = document.getElementById("seal");
      seal.classList.add("pulse");
      setTimeout(() => seal.classList.remove("pulse"), 260);
    }
    lastOverall = overall.gpa;
  }

  function renderAll(rerenderSemesterList) {
    renderEditingBadge();
    renderSummary();
    if (rerenderSemesterList) renderSemesterList();
  }


  /* Student info */
  
  const stuName = document.getElementById("stuName");
  const stuId = document.getElementById("stuId");
  const stuDept = document.getElementById("stuDept");

  stuName.value = state.student.name;
  stuId.value = state.student.id;
  stuDept.value = state.student.dept;

  stuName.addEventListener("input", e => { state.student.name = e.target.value; saveState(); });
  stuId.addEventListener("input", e => { state.student.id = e.target.value; saveState(); });
  stuDept.addEventListener("input", e => { state.student.dept = e.target.value; saveState(); });


  /* Target CGPA / Required GPA calculator */
  
  document.getElementById("calcTargetBtn").addEventListener("click", () => {
    const target = parseFloat(document.getElementById("targetCgpa").value);
    const totalCredits = parseFloat(document.getElementById("targetTotalCredits").value);
    const resultBox = document.getElementById("targetResult");

    if (isNaN(target) || target < 0 || target > 4) {
      resultBox.innerHTML = `<div class="result-line warn">Enter a target CGPA between 0.00 and 4.00.</div>`;
      return;
    }
    if (isNaN(totalCredits) || totalCredits <= 0) {
      resultBox.innerHTML = `<div class="result-line warn">Enter the total credit hours of your full degree.</div>`;
      return;
    }

    const completed = overallStatsIncludingDraft();
    const remainingCredits = totalCredits - completed.credits;

    if (remainingCredits <= 0) {
      const verdict = completed.gpa >= target ? "already met" : "not reachable — no credits remain";
      resultBox.innerHTML = `<div class="result-line ${completed.gpa >= target ? "ok" : "warn"}">
        You've logged ${completed.credits} of ${totalCredits} credits already — your target is ${verdict}. Current CGPA: ${completed.gpa.toFixed(2)}.
      </div>`;
      return;
    }

    const requiredQuality = target * totalCredits - completed.quality;
    const requiredGpa = requiredQuality / remainingCredits;

    if (requiredGpa > 4.0) {
      resultBox.innerHTML = `<div class="result-line warn">
        You'd need a ${requiredGpa.toFixed(2)} GPA in your remaining ${remainingCredits} credits — above the 4.00 scale, so this target isn't reachable from here.
      </div>`;
    } else if (requiredGpa <= 0) {
      resultBox.innerHTML = `<div class="result-line ok">
        You've already secured this target — even a 0.00 GPA in the remaining ${remainingCredits} credits keeps you at or above ${target.toFixed(2)}.
      </div>`;
    } else {
      resultBox.innerHTML = `<div class="result-line ok">
        Average <strong>${requiredGpa.toFixed(2)} GPA</strong> across your remaining ${remainingCredits} credits reaches a ${target.toFixed(2)} CGPA.
      </div>`;
    }
  });


  /* Grade scale (collapsible) */
  
  const gradeScaleTbody = document.getElementById("gradeScaleBody_tbody");
  gradeScaleTbody.innerHTML = GRADE_SCALE.map(
    g => `<tr><td>${g.range}</td><td>${g.grade}</td><td>${g.point.toFixed(2)}</td></tr>`
  ).join("");

  const gradeScaleToggle = document.getElementById("gradeScaleToggle");
  const gradeScaleBody = document.getElementById("gradeScaleBody");
  const gradeScaleChevron = document.getElementById("gradeScaleChevron");
  gradeScaleToggle.addEventListener("click", () => {
    const isHidden = gradeScaleBody.classList.contains("hidden");
    gradeScaleBody.classList.toggle("hidden");
    gradeScaleChevron.classList.toggle("open");
    gradeScaleToggle.setAttribute("aria-expanded", String(isHidden));
  });

  
  /* Clear all data */
  
  document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (!confirm("This permanently deletes every saved semester and student info from this browser. Continue?")) return;
    state = defaultState();
    saveState();
    stuName.value = ""; stuId.value = ""; stuDept.value = "";
    semesterNameInput.value = "";
    renderCourses();
    renderAll(true);
  });


  /* Theme */
  
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    document.getElementById("themeToggle").querySelector(".theme-icon").textContent =
      state.theme === "dark" ? "☾" : "◐";
  }
  document.getElementById("themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });


  /*  Init */
  
  semesterNameInput.value = state.draft.name;
  applyTheme();
  renderCourses();
  renderAll(true);

})();
