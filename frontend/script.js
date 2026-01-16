// ================================
// CONFIG
// ================================
const ACCESS_CODE = "relicarium";
const ACCESS_KEY = "heist_access";
const INDEX_KEY = "heist_index";
const TEAM_KEY = "heist_team_no";

// ================================
// TIMER STATE
// ================================
let timerInterval = null;
let timeElapsed = 0;

// ================================
// QUIZ STATE
// ================================
let questions = [];
let currentIndex = 0;
let quizStarted = false;

// ================================
// RESTORE SESSION ON LOAD
// ================================
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem(ACCESS_KEY) === "granted") {
    currentIndex = parseInt(sessionStorage.getItem(INDEX_KEY)) || 0;
    startQuizUI();
  }
});

// ================================
// ACCESS CHECK (TEAM + CODE)
// ================================
function checkAccess() {
  const teamInput = document.getElementById("teamNo");
  const codeInput = document.getElementById("accessCode");
  const error = document.getElementById("accessError");

  if (!teamInput || !codeInput) return;

  const teamNo = teamInput.value.trim();
  const code = codeInput.value.trim().toLowerCase();

  if (teamNo === "") {
    error.innerText = "Team No is required.";
    return;
  }

  if (code !== ACCESS_CODE) {
    error.innerText = "Invalid access code.";
    return;
  }

  sessionStorage.setItem(ACCESS_KEY, "granted");
  sessionStorage.setItem(TEAM_KEY, teamNo);
  sessionStorage.setItem(INDEX_KEY, "0");

  currentIndex = 0;
  startQuizUI();
}

// ================================
// START QUIZ UI
// ================================
function startQuizUI() {
  const accessScreen = document.getElementById("accessScreen");
  if (accessScreen) accessScreen.style.display = "none";

  document.querySelector(".chat-header").classList.remove("hidden");
  document.querySelector(".chat-container").classList.remove("hidden");

  quizStarted = true;

  if (questions.length === 0) {
    loadQuestions();
  }
}

// ================================
// LOAD QUESTIONS (BACKEND)
// ================================
function loadQuestions() {
  fetch("http://127.0.0.1:8000/questions")
    .then(res => res.json())
    .then(data => {
      questions = data.questions || [];

      if (questions.length > 0) {
        showQuestion();
      } else {
        showBotMessage("No questions available.");
      }
    })
    .catch(() => {
      showBotMessage("Failed to load questions.");
    });
}

// ================================
// SHOW QUESTION
// ================================
function showQuestion() {
  if (currentIndex >= questions.length) return;

  showBotMessage(questions[currentIndex].question);
  startTimer();

  setTimeout(() => {
    const input = document.getElementById("userInput");
    if (input) input.focus();
  }, 100);
}

// ================================
// TIMER (INCREASING)
// ================================
function startTimer() {
  clearInterval(timerInterval);
  timeElapsed = 0;
  updateTimerUI();

  timerInterval = setInterval(() => {
    timeElapsed++;
    updateTimerUI();
  }, 1000);
}

function updateTimerUI() {
  const timer = document.getElementById("timer");
  if (timer) timer.innerText = `Time: ${timeElapsed}s`;
}

// ================================
// SCORE CALCULATION (TIME-BASED)
// ================================
function calculateScore(timeTaken) {
  const score = 100 - timeTaken;
  return score < 10 ? 10 : score;
}

// ================================
// SEND ANSWER
// ================================
function sendAnswer() {
  if (!quizStarted) return;

  const input = document.getElementById("userInput");
  if (!input) return;

  const rawAnswer = input.value.trim();
  if (rawAnswer === "") return;

  showUserMessage(rawAnswer);
  input.value = "";

  const score = calculateScore(timeElapsed);

  fetch("http://127.0.0.1:8000/check-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_no: sessionStorage.getItem(TEAM_KEY),
      qid: currentIndex,
      answer: rawAnswer.toLowerCase(),
      time_taken: timeElapsed,
      score: score
    })
  })
    .then(res => res.json())
    .then(result => {
      if (result.correct) {
        clearInterval(timerInterval);

        showBotMessage(
          `Correct! ⏱ ${timeElapsed}s | ⭐ Score: ${score}`
        );

        currentIndex++;
        sessionStorage.setItem(INDEX_KEY, currentIndex.toString());

        if (currentIndex < questions.length) {
          setTimeout(showQuestion, 800);
        } else {
          showBotMessage("🎉 Quiz completed!");
          document.getElementById("timer").innerText = "";
          sessionStorage.removeItem(INDEX_KEY);
        }
      } else {
        showBotMessage("Wrong answer. Try again.");
      }
    })
    .catch(() => {
      showBotMessage("Server error. Try again.");
    });
}

// ================================
// MESSAGE HELPERS
// ================================
function showBotMessage(text) {
  return addMessage(text, "bot");
}

function showUserMessage(text) {
  return addMessage(text, "user");
}

function addMessage(text, type) {
  const chatBox = document.getElementById("chatBox");
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// ================================
// GLOBAL ENTER KEY (NO RELOAD)
// ================================
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();

    const accessScreen = document.getElementById("accessScreen");
    if (accessScreen && accessScreen.style.display !== "none") {
      checkAccess();
      return;
    }

    if (quizStarted) {
      sendAnswer();
    }
  }
});
