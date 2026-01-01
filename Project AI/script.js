const initialData = {
    users: [{ username: "אדמין", password: "123" }],
    recipes: [
        { id: 1, title: "פסטה ברוטב עגבניות 🍝", ingredients: ["חבילת פסטה", "5 עגבניות", "3 שיני שום"], steps: ["מרתיחים מים עם מלח", "מבשלים את פסטה", "מכינים רוטב במחבת", "מערבבים יחד"] },
        { id: 2, title: "פנקייק שוקולד מפנק 🥞", ingredients: ["כוס חלב", "ביצה אחת", "כוס קמח"], steps: ["מערבבים הכל", "מחממים מחבת", "מטגנים עד להופעת בועות", "הופכים"] }
    ],
    settings: { theme: 'child', mode: 'dark', rate: 1, music: 'calm' }
};

let appData = JSON.parse(localStorage.getItem('recipeAppData')) || initialData;
const synth = window.speechSynthesis;
let currentMusic = null;

const showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    createAnimations();
};

const applySettings = () => {
    const isDark = appData.settings.mode === 'dark';
    document.body.style.background = isDark ? "#000" : "#f0f0f0";
    document.body.className = `${appData.settings.mode}-mode ${appData.settings.theme}-style`;
    localStorage.setItem('recipeAppData', JSON.stringify(appData));
};

document.getElementById('register-show-btn').onclick = () => {
    document.getElementById('login-btns-container').style.display = 'none';
    document.getElementById('register-btns-container').style.display = 'block';
    document.getElementById('auth-title').innerText = "הרשמה לממלכה";
};

document.getElementById('login-show-btn').onclick = () => {
    document.getElementById('login-btns-container').style.display = 'block';
    document.getElementById('register-btns-container').style.display = 'none';
    document.getElementById('auth-title').innerText = "ספר המתכונים הקסום";
};

document.getElementById('register-btn').onclick = () => {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    if(userIn && passIn) {
        if(appData.users.find(u => u.username === userIn)) {
            alert("שם המשתמש כבר קיים!");
            return;
        }
        appData.users.push({ username: userIn, password: passIn });
        localStorage.setItem('recipeAppData', JSON.stringify(appData));
        alert("נרשמת בהצלחה! תוכלי להיכנס כעת.");
        document.getElementById('login-show-btn').click();
    }
};

document.getElementById('login-btn').onclick = () => {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const user = appData.users.find(u => u.username === userIn && u.password === passIn);
    if (user) {
        renderRecipes();
        showScreen('recipe-list-screen');
    } else {
        const err = document.getElementById('login-error');
        err.innerText = "פרטים שגויים!";
        err.style.display = 'block';
    }
};

document.getElementById('open-add-screen-btn').onclick = () => showScreen('add-recipe-screen');

document.getElementById('save-new-recipe-btn').onclick = () => {
    const title = document.getElementById('new-title').value;
    const ings = document.getElementById('new-ingredients').value.split(',').map(i => i.trim()).filter(i => i);
    const stps = document.getElementById('new-steps').value.split('.').map(s => s.trim()).filter(s => s);
    if(title && ings.length && stps.length) {
        appData.recipes.push({ id: Date.now(), title, ingredients: ings, steps: stps });
        localStorage.setItem('recipeAppData', JSON.stringify(appData));
        renderRecipes();
        showScreen('recipe-list-screen');
    }
};

const renderRecipes = () => {
    const container = document.getElementById('recipes-container');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    container.innerHTML = "";
    
    // סינון המתכונים והצגתם עם צבע זוהר משתנה
    const filtered = appData.recipes.filter(r => r.title.toLowerCase().includes(searchTerm));
    filtered.forEach((r, index) => {
        const colorIndex = index % 5; // מחזורי של 5 צבעים
        const div = document.createElement('div');
        div.className = 'recipe-card';
        div.innerHTML = `
            <div class="card-emoji">🍳</div>
            <div class="card-info">
                <h3 class="glow-text-${colorIndex}">${r.title}</h3>
                <p>לחצי להתחלת הבישול!</p>
            </div>`;
        div.onclick = () => openRecipe(r);
        container.appendChild(div);
    });
};

const openRecipe = (recipe) => {
    document.getElementById('recipe-title').innerText = recipe.title;
    document.querySelector('.recipe-content-box').innerHTML = `
        <div class="recipe-inner">
            <h3 class="neon-text-pink">🍎 מצרכים:</h3>
            <ul class="ing-list">${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
            <h3 class="neon-text-pink">🍳 שלבי הכנה:</h3>
            <div class="steps-list">${recipe.steps.map((s, idx) => `<p><span>${idx+1}</span> ${s}</p>`).join('')}</div>
        </div>`;
    showScreen('recipe-detail-screen');
    document.getElementById('start-speech-btn').onclick = () => speakAll(recipe);
};

const speakAll = async (recipe) => {
    synth.cancel();
    if(appData.settings.music !== 'none') {
        if(currentMusic) currentMusic.pause();
        currentMusic = document.getElementById(`audio-${appData.settings.music}`);
        currentMusic.play();
    }
    const speak = (t) => new Promise(r => { 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'he-IL'; u.rate = appData.settings.voiceRate || 1; u.onend = r; 
        synth.speak(u); 
    });
    for(let i of recipe.ingredients) { await speak(i); await new Promise(r => setTimeout(r, 1500)); }
    for(let s of recipe.steps) { await speak(s); await new Promise(r => setTimeout(r, 1500)); }
};

document.getElementById('back-to-list-btn').onclick = () => {
    synth.cancel();
    if(currentMusic) currentMusic.pause();
    showScreen('recipe-list-screen');
};

document.getElementById('pause-speech-btn').onclick = () => synth.pause();
document.getElementById('resume-speech-btn').onclick = () => synth.resume();
document.getElementById('stop-music-btn').onclick = () => { if(currentMusic) currentMusic.pause(); };

document.getElementById('save-settings-btn').onclick = () => {
    appData.settings.theme = document.getElementById('user-style').value;
    appData.settings.mode = document.getElementById('theme-mode').value;
    appData.settings.voiceRate = parseFloat(document.getElementById('voice-speed').value);
    appData.settings.music = document.getElementById('bg-music').value;
    applySettings();
    showScreen('recipe-list-screen');
};

const createAnimations = () => {
    const container = document.getElementById('background-animations');
    container.innerHTML = "";
    const isLogin = document.getElementById('login-screen').style.display !== 'none';
    const isChild = appData.settings.theme === 'child';
    const isDark = appData.settings.mode === 'dark';
    
    const emojis = isChild ? ['🍭','🌈','🍩','✨','🍓','🍕','🧁'] : ['🥗','🍲','☕','🥐','🍽️'];
    for(let i=0; i < (isLogin ? 40 : 15); i++) {
        const div = document.createElement('div');
        div.className = 'floating-emoji';
        div.innerText = emojis[Math.floor(Math.random()*emojis.length)];
        div.style.left = Math.random()*100 + "vw";
        div.style.fontSize = (Math.random()*3 + 1.5) + "rem";
        div.style.animationDuration = (Math.random()*5 + 6) + "s";
        container.appendChild(div);
    }

    if (isChild && isDark) {
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#00ff00', '#ffffff'];
        for(let i=0; i < 35; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + "vw";
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = (Math.random() * 8 + 5) + "px";
            confetti.style.height = confetti.style.width;
            confetti.style.animationDuration = (Math.random() * 3 + 2) + "s";
            confetti.style.animationDelay = (Math.random() * 4) + "s";
            confetti.style.boxShadow = `0 0 10px ${confetti.style.backgroundColor}`;
            container.appendChild(confetti);
        }
    }
};

applySettings();
showScreen('login-screen');