
document.addEventListener('DOMContentLoaded', () => {

    const modalTriggers: NodeListOf<Element> = document.querySelectorAll('[data-bs-toggle="modal"]');
    const modals: NodeListOf<HTMLElement> = document.querySelectorAll('.modal');
    const closeButtons: NodeListOf<Element> = document.querySelectorAll('.btn-close');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(this: HTMLElement) {
            const targetId = this.getAttribute('data-bs-target')?.substring(1);
            if (!targetId) return;

            const modal = document.getElementById(targetId);
            if (modal) modal.classList.add('show');
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', function(this: HTMLElement) {
            const modal = this.closest('.modal') as HTMLElement | null;
            if (modal) modal.classList.remove('show');
        });
    });

    window.addEventListener('click', (event: MouseEvent) => {
        modals.forEach(modal => {
            if (event.target instanceof HTMLElement && event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});
