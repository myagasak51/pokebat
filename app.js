const monsters = [
  { id: "mewtwo", name: "ミュウツー", types: ["エスパー"], power: 100, weaknesses: ["むし", "ゴースト", "あく"], image: "assets/pokemon/mewtwo.png", color: "#a879ff", move: "りゅうのはどう", moveFx: "dragon-beam", evolved: { name: "メガミュウツーX", types: ["エスパー", "かくとう"], power: 120, image: "assets/pokemon/mega-mewtwo-x.png", color: "#c18cff" } },
  { id: "kyogre", name: "カイオーガ", types: ["みず"], power: 98, weaknesses: ["でんき", "くさ"], image: "assets/pokemon/kyogre.png", color: "#2fc4ff", move: "みずのいぶき", moveFx: "water-magic", evolved: { name: "ゲンシカイオーガ", types: ["みず"], power: 118, image: "assets/pokemon/primal-kyogre.png", color: "#19e0ff" } },
  { id: "groudon", name: "グラードン", types: ["じめん"], power: 98, weaknesses: ["みず", "くさ", "こおり"], image: "assets/pokemon/groudon.png", color: "#e36f45", move: "りゅうのはどう", moveFx: "dragon-beam", evolved: { name: "ゲンシグラードン", types: ["じめん", "ほのお"], power: 118, image: "assets/pokemon/primal-groudon.png", color: "#ff6847" } },
  { id: "zekrom", name: "ゼクロム", types: ["ドラゴン", "でんき"], power: 96, weaknesses: ["じめん", "こおり", "ドラゴン", "フェアリー"], image: "assets/pokemon/zekrom.png", color: "#7d94ac", move: "りゅうのガード", moveFx: "dragon-shield" },
  { id: "lugia", name: "ルギア", types: ["エスパー", "ひこう"], power: 95, weaknesses: ["でんき", "こおり", "いわ", "ゴースト", "あく"], image: "assets/pokemon/lugia.png", color: "#d7edff", move: "はかいこうせん", moveFx: "destruction-light" },
  { id: "zygarde", name: "ジガルデ", types: ["ドラゴン", "じめん"], power: 94, weaknesses: ["こおり", "ドラゴン", "フェアリー"], image: "assets/pokemon/zygarde.png", color: "#76e640", move: "はかいビースト", moveFx: "destruction-beast", evolved: { name: "メガジガルデ", types: ["ドラゴン", "じめん"], power: 95, image: "assets/pokemon/mega-zygarde.png", color: "#a3ff4d" } },
  { id: "mew", name: "ミュウ", types: ["エスパー"], power: 92, weaknesses: ["むし", "ゴースト", "あく"], image: "assets/pokemon/mew.png", color: "#ff8ecb", move: "はどうだん", moveFx: "aura-orb" },
  { id: "fire", name: "ファイアー", types: ["ほのお", "ひこう"], power: 82, weaknesses: ["いわ", "みず", "でんき"], image: "assets/pokemon/moltres.png", color: "#ff9d32", move: "ねつのいぶき", moveFx: "fire-magic", evolved: { name: "ファイアー（ガラル）", types: ["あく", "ひこう"], power: 86, image: "assets/pokemon/galarian-moltres.png", color: "#cf4777" } }
];

const state = {
  mode: "cpu",
  teams: [[], []],
  tickets: [0, 0],
  picks: 0,
  round: 0,
  score: [0, 0],
  used: [new Set(), new Set()],
  selected: [null, null],
  sound: true,
  busy: false
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function tone(frequency = 440, duration = .08, type = "square") {
  if (!state.sound) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const context = tone.context ||= new AudioCtx();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.045, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function showScreen(id, step) {
  $$(".screen").forEach(screen => screen.classList.toggle("active", screen.id === id));
  $$("#stepTrack span").forEach((item, index) => item.classList.toggle("active", index === step));
}

function monsterCard(monster, evolved = false, extraClass = "") {
  const data = evolved && monster.evolved ? monster.evolved : monster;
  return `
    <article class="monster-card ${extraClass}" style="--accent:${data.color}">
      <div class="monster-info">
        <div class="monster-name"><span>${data.name}</span><b><small>POWER</small>${data.power}</b></div>
        <div class="types">${data.types.map(type => `<span class="type">${type}</span>`).join("")}</div>
      </div>
      <div class="monster-visual"><img src="${data.image}" alt="${data.name}"></div>
    </article>`;
}

function resetGame() {
  state.teams = [[], []];
  state.tickets = [0, 0];
  state.picks = 0;
  state.round = 0;
  state.score = [0, 0];
  state.used = [new Set(), new Set()];
  state.selected = [null, null];
  state.busy = false;
  updateTeams();
  updateDraftHeader();
}

function updateTeams() {
  [0, 1].forEach(player => {
    const team = state.teams[player];
    $(`#teamP${player + 1}`).innerHTML = [0, 1].map(index =>
      team[index] ? monsterCard(team[index]) : `<div class="empty-slot">EMPTY SLOT 0${index + 1}</div>`
    ).join("");
    $(`#ticketP${player + 1}`).textContent = `EVOLUTION × ${state.tickets[player]}`;
  });
}

function updateDraftHeader() {
  const player = state.picks < 2 ? 1 : 2;
  $("#draftPlayer").textContent = `${player}P`;
  $("#draftCount").textContent = String(Math.min(state.picks + 1, 4)).padStart(2, "0");
  $("#turnBadge").textContent = `${player}P PICK`;
}

function buildRoulette() {
  $("#rouletteRing").innerHTML = monsters.map((monster, index) =>
    `<div class="roulette-item" style="--accent:${monster.color};--angle:${index * 45}deg"><img src="${monster.image}" alt="${monster.name}"><span>${monster.name}</span></div>`
  ).join("");
}

async function showOverlay(html, duration) {
  $("#overlayContent").innerHTML = html;
  $("#overlay").classList.add("show");
  await wait(duration);
  $("#overlay").classList.remove("show");
  await wait(220);
}

async function spinRoulette() {
  if (state.busy || state.picks >= 4) return;
  state.busy = true;
  $("#rouletteButton").disabled = true;
  $("#roulette").classList.add("spinning");
  $("#rouletteHelp").textContent = "抽選中...";

  const selectedIndex = Math.floor(Math.random() * monsters.length);
  const rotations = 4 + Math.floor(Math.random() * 3);
  const target = rotations * 360 - selectedIndex * 45;
  $("#rouletteRing").style.transform = `rotate(${target}deg)`;
  for (let i = 0; i < 13; i++) {
    tone(260 + i * 24, .045);
    await wait(105 + i * 9);
  }
  await wait(450);

  const monster = monsters[selectedIndex];
  const player = state.picks < 2 ? 0 : 1;
  state.teams[player].push(monster);
  state.picks++;
  $("#roulette").classList.remove("spinning");
  tone(760, .28, "sine");
  await showOverlay(`
    <p class="eyebrow">${player + 1}P GET!</p>
    <div class="reveal-card">${monsterCard(monster)}</div>
  `, 3000);
  updateTeams();

  if (Math.random() < .4) {
    state.tickets[player]++;
    updateTeams();
    tone(920, .4, "sine");
    await showOverlay(`<div class="ticket-win">進化チケット<br>GET!</div><p class="overlay-subtitle">${player + 1}P EVOLUTION × ${state.tickets[player]}</p>`, 1800);
  }

  if (state.picks >= 4) {
    await showOverlay(`<p class="overlay-title">バトル<br>スタート</p><p class="overlay-subtitle">2匹を選んで勝負！</p>`, 3000);
    beginBattle();
    return;
  }

  updateDraftHeader();
  $("#rouletteRing").style.transition = "none";
  $("#rouletteRing").style.transform = "rotate(0deg)";
  requestAnimationFrame(() => requestAnimationFrame(() => $("#rouletteRing").style.transition = ""));
  $("#rouletteHelp").textContent = `${state.picks < 2 ? "1P" : "2P"}の次のポケモンを選ぼう`;
  $("#rouletteButton").disabled = false;
  state.busy = false;

  if (state.mode === "cpu" && state.picks >= 2) {
    $("#rouletteHelp").textContent = "コンピューターが抽選します";
    await wait(900);
    spinRoulette();
  }
}

function beginBattle() {
  state.busy = false;
  showScreen("battleScreen", 2);
  state.round = 0;
  renderRound();
}

function renderRound() {
  state.selected = [null, null];
  $("#roundNumber").textContent = state.round + 1;
  $("#scoreP1").textContent = state.score[0];
  $("#scoreP2").textContent = state.score[1];
  $("#battleInstruction").textContent = "1P ポケモンを選択";
  $("#fighterP1").innerHTML = `<span class="waiting">SELECT</span>`;
  $("#fighterP2").innerHTML = `<span class="waiting">WAIT</span>`;
  renderChoices();
}

function renderChoices() {
  [0, 1].forEach(player => {
    const container = $(`#choicesP${player + 1}`);
    container.innerHTML = state.teams[player].map((monster, index) => {
      const disabled = state.used[player].has(index) || (player === 1 && !state.selected[0]);
      return `<button class="choice-button" data-player="${player}" data-index="${index}" ${disabled ? "disabled" : ""}>${monster.name}<br><small>POWER ${monster.power}</small></button>`;
    }).join("");
  });
}

async function chooseMonster(player, index) {
  if (state.busy || state.used[player].has(index) || (player === 1 && !state.selected[0])) return;
  const monster = state.teams[player][index];
  state.selected[player] = { monster, index, evolved: false };
  $(`#fighterP${player + 1}`).innerHTML = monsterCard(monster);
  tone(player === 0 ? 520 : 410, .12);

  if (state.tickets[player] > 0 && monster.evolved) {
    const useEvolution = state.mode === "cpu" && player === 1
      ? Math.random() < .7
      : await askEvolution(monster);
    if (useEvolution) {
      state.tickets[player]--;
      state.selected[player].evolved = true;
      $(`#fighterP${player + 1}`).innerHTML = monsterCard(monster, true);
      tone(850, .45, "sine");
    }
  }

  if (player === 0) {
    $("#battleInstruction").textContent = state.mode === "cpu" ? "CPU が選択中..." : "2P ポケモンを選択";
    renderChoices();
    if (state.mode === "cpu") {
      state.busy = true;
      await wait(900);
      state.busy = false;
      const available = [0, 1].filter(i => !state.used[1].has(i));
      chooseMonster(1, available[Math.floor(Math.random() * available.length)]);
    }
  } else {
    renderChoices();
    runBattle();
  }
}

function askEvolution(monster) {
  return new Promise(resolve => {
    $("#evolvePreview").innerHTML = `<div class="evolve-compare">${monsterCard(monster)}<div class="evolve-arrow">▶</div>${monsterCard(monster, true)}</div>`;
    $("#evolveModal").classList.add("show");
    const finish = value => {
      $("#evolveModal").classList.remove("show");
      $("#evolveYes").onclick = null;
      $("#evolveNo").onclick = null;
      resolve(value);
    };
    $("#evolveYes").onclick = () => finish(true);
    $("#evolveNo").onclick = () => finish(false);
  });
}

function selectedData(selection) {
  return selection.evolved && selection.monster.evolved ? selection.monster.evolved : selection.monster;
}

function battlePower(selection, opponentSelection) {
  const data = selectedData(selection);
  const opponent = selectedData(opponentSelection);
  const matchedWeaknesses = opponent.types.filter(type => selection.monster.weaknesses.includes(type));
  const reducedPower = matchedWeaknesses.length
    ? Math.round(data.power * .8 * 10) / 10
    : data.power;

  return {
    originalPower: data.power,
    power: reducedPower,
    matchedWeaknesses
  };
}

async function runBattle() {
  state.busy = true;
  $("#battleInstruction").textContent = "バトル準備...";
  await wait(3000);

  const battlePowers = [
    battlePower(state.selected[0], state.selected[1]),
    battlePower(state.selected[1], state.selected[0])
  ];

  for (let player = 0; player < 2; player++) {
    const result = battlePowers[player];
    if (!result.matchedWeaknesses.length) continue;
    const data = selectedData(state.selected[player]);
    tone(210, .45, "sawtooth");
    await showOverlay(`
      <div class="weakness-alert">
        <p class="weakness-player">${player + 1}P ${data.name}</p>
        <h2>弱点！</h2>
        <div class="weakness-types">${result.matchedWeaknesses.map(type => `<span>${type}</span>`).join("")}</div>
        <p class="weakness-label">強さが 20% ダウン</p>
        <div class="power-down">
          <b>${result.originalPower}</b><i>→</i><strong>${result.power}</strong>
        </div>
      </div>
    `, 3000);
  }

  for (let player = 0; player < 2; player++) {
    const selection = state.selected[player];
    const data = selectedData(selection);
    tone(player === 0 ? 690 : 560, .35, "sawtooth");
    await showOverlay(`
      <div class="move-player player-${player + 1}">${player + 1}P ATTACK</div>
      <div class="move-scene">
        <div class="move-pokemon" style="--accent:${data.color}">
          <img src="${data.image}" alt="${data.name}">
          <strong>${data.name}</strong>
        </div>
        <div class="move-art ${selection.monster.moveFx}" style="--accent:${data.color}">
          <div class="move-core"></div><div class="move-rays"></div><div class="move-symbol"></div>
        </div>
      </div>
      <h2 class="move-name">${selection.monster.move}</h2>
      <p class="move-owner">${data.name} の必殺技！</p>
    `, 2000);
  }

  const powers = battlePowers.map(result => result.power);
  let winner = -1;
  if (powers[0] > powers[1]) winner = 0;
  if (powers[1] > powers[0]) winner = 1;
  if (winner >= 0) state.score[winner]++;

  const resultHtml = winner < 0
    ? `<p class="overlay-title">DRAW!</p><p class="overlay-subtitle">POWER ${powers[0]} — ${powers[1]}</p>`
    : `<div class="winner-result"><p class="overlay-title">WIN!</p><div class="reveal-card winner-card">${monsterCard(state.selected[winner].monster, state.selected[winner].evolved)}</div><p class="overlay-subtitle">${winner + 1}P / POWER ${powers[winner]}</p></div>`;
  tone(winner < 0 ? 360 : 820, .6, "sine");
  await showOverlay(resultHtml, 3000);

  state.selected.forEach((selection, player) => state.used[player].add(selection.index));
  $("#scoreP1").textContent = state.score[0];
  $("#scoreP2").textContent = state.score[1];
  state.round++;
  state.busy = false;

  if (state.round < 2) {
    renderRound();
  } else {
    showFinalResult();
  }
}

function showFinalResult() {
  showScreen("resultScreen", 3);
  const [p1, p2] = state.score;
  $("#finalResult").textContent = p1 > p2 ? "1P WIN!" : p2 > p1 ? "2P WIN!" : "ひきわけ！";
  $("#finalScore").textContent = `${p1} — ${p2}`;
  tone(p1 !== p2 ? 740 : 440, .8, "sine");
}

function startDraft() {
  resetGame();
  showScreen("draftScreen", 1);
  $("#rouletteHelp").textContent = "ボタンを押してルーレットを回そう";
  $("#rouletteButton").disabled = false;
  $("#rouletteRing").style.transform = "rotate(0deg)";
}

$$(".mode-card").forEach(button => button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  tone(620, .15);
  startDraft();
}));

$("#rouletteButton").addEventListener("click", spinRoulette);
$("#choicesP1").addEventListener("click", event => {
  const button = event.target.closest(".choice-button");
  if (button) chooseMonster(Number(button.dataset.player), Number(button.dataset.index));
});
$("#choicesP2").addEventListener("click", event => {
  const button = event.target.closest(".choice-button");
  if (button) chooseMonster(Number(button.dataset.player), Number(button.dataset.index));
});
$("#restartButton").addEventListener("click", startDraft);
$("#finishButton").addEventListener("click", () => showScreen("modeScreen", 0));
$("#brandButton").addEventListener("click", () => {
  if (!state.busy) showScreen("modeScreen", 0);
});
$("#soundButton").addEventListener("click", () => {
  state.sound = !state.sound;
  $("#soundButton b").textContent = state.sound ? "ON" : "OFF";
  if (state.sound) tone(600, .1);
});

buildRoulette();
updateTeams();
