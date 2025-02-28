"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.btn-close');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function () {
            var _a;
            const targetId = (_a = this.getAttribute('data-bs-target')) === null || _a === void 0 ? void 0 : _a.substring(1);
            if (!targetId)
                return;
            const modal = document.getElementById(targetId);
            if (modal)
                modal.classList.add('show');
        });
    });
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal)
                modal.classList.remove('show');
        });
    });
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target instanceof HTMLElement && event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});
