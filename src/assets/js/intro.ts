
function save_login(): void {
    const inputElement = document.getElementById('input_login') as HTMLInputElement;
    const login: string = inputElement.value;
    localStorage.setItem("g_my_login", login);
    
    if (login === '') {
        const lvl: number = Math.round(6 + 4 * Math.random());
        localStorage.setItem("g_my_eval", JSON.stringify([lvl]));
        window.location.href = `pages/level${lvl}.html`;
    } else {
        window.location.href = 'pages/level1.html';
    }
}

function goToExam(): void {
    const lvl: number = Math.round(6 + 4 * Math.random());
    localStorage.setItem("g_my_eval", JSON.stringify([lvl]));
    window.location.href = `pages/level${lvl}.html`;
}

function load_login(): string {
    let login: string | null = localStorage.getItem("g_my_login");
    if (!login) {
        login = ''; 
    }
    return login;
}
