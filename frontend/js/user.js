
const buttons  = document.querySelectorAll('.menu-btn');
const panels   = document.querySelectorAll('.panel');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.section; // welcome, info, edit

        // Ocultar todos los paneles
        panels.forEach(panel => {
            panel.classList.remove('active');
        });

        // Mostrar solo el panel seleccionado
        const targetPanel = document.getElementById(target);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    });
});

