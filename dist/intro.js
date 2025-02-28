"use strict";
function save_login() {
    const inputElement = document.getElementById('input_login');
    const login = inputElement.value;
    localStorage.setItem("g_my_login", login);
    if (login === '') {
        const lvl = Math.round(6 + 4 * Math.random());
        localStorage.setItem("g_my_eval", JSON.stringify([lvl]));
        window.location.href = `pages/level${lvl}.html`;
    }
    else {
        window.location.href = 'pages/level1.html';
    }
}
function goToExam() {
    const lvl = Math.round(6 + 4 * Math.random());
    localStorage.setItem("g_my_eval", JSON.stringify([lvl]));
    window.location.href = `pages/level${lvl}.html`;
}
function load_login() {
    let login = localStorage.getItem("g_my_login");
    if (!login) {
        login = '';
    }
    return login;
}
