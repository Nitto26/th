// ===============================
// ACCESS CODE LOGIC
// ===============================
const ACCESS_CODE = "Relicarium";

function checkAccess() {
  const input = document.getElementById("accessCode").value.trim();
  const error = document.getElementById("accessError");

  if (input === ACCESS_CODE) {
    // Hide access screen
    document.getElementById("accessScreen").style.display = "none";

    // Show quiz UI
    document.querySelector(".chat-header").classList.remove("hidden");
    document.querySelector(".chat-container").classList.remove("hidden");

    // Start loading questions
    loadQuestions();
  } else {
    error.innerText = "Invalid code. Access denied.";
  }
}


// ===============================
// TIMER VARIABLES
// ===============================
let timerInterval;
let timeElapsed = 0; // seconds spent on current question

// ===============================
// QUIZ VARIABLES
// ===============================
let questions = [];
let currentIndex = 0;

// ===============================
// LOAD QUESTIONS FROM BACKEND
// ===============================
function loadQuestions() {
  fetch("http://127.0.0.1:8000/questions")
    .then(res => res.json())
    .then(data => {
      questions = data.questions;
      showQuestion();
    })
    .catch(err => {
      console.error(err);
      showBotMessage("Failed to load questions.");
    });
}


// ===============================
// SHOW QUESTION + START TIMER
// ===============================
function showQuestion() {
  showBotMessage(questions[currentIndex].question);
  startTimer();
}

// ===============================
// INCREASING TIMER
// ===============================
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
  const timerEl = document.getElementById("timer");
  if (timerEl) {
    timerEl.innerText = `Time: ${timeElapsed}s`;
  }
}

// ===============================
// SEND ANSWER
// ===============================
function sendAnswer() {
  const input = document.getElementById("userInput");
  const rawInput = input.value.trim();
  if (rawInput === "") return;

  const userAnswer = rawInput.toLowerCase();
  showUserMessage(rawInput);
  input.value = "";

  // SEND ANSWER TO BACKEND
  fetch("http://127.0.0.1:8000/check-answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      qid: currentIndex,
      answer: userAnswer,
      time_taken: timeElapsed
    })
  })
    .then(res => res.json())
    .then(result => {

      if (result.correct) {
        clearInterval(timerInterval);

        // Animate user bubble
        const userBubble = document.querySelector(".message.user:last-child");
        if (userBubble) userBubble.classList.add("correct-pop");

        // Success message
        const botBubble = showBotMessage(
          `Correct! Solved in ${timeElapsed} seconds.`
        );
        botBubble.classList.add("correct-glow");

        // Screen pulse
        document.body.classList.add("treasure-pulse");
        setTimeout(() => {
          document.body.classList.remove("treasure-pulse");
        }, 600);

        currentIndex++;

        if (currentIndex < questions.length) {
          setTimeout(showQuestion, 1000);
        } else {
          showBotMessage("🎉 Quiz completed!");
          document.getElementById("timer").innerText = "";
        }

      } else {
        showBotMessage("Wrong answer. Try again.");
      }

    })
    .catch(err => {
      console.error(err);
      showBotMessage("Server error. Try again.");
    });
}

// ===============================
// MESSAGE HELPERS
// ===============================
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
