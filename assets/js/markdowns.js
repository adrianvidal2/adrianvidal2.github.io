// markdowns.js

// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function () {
    // Ruta al archivo Markdown
    const markdownFile = '/home/adrian/webpage/new/adrianvidal2.github.io/assets/markdown/first.md';

    // Obtén el contenedor
    var markdownContainer = document.getElementById('layout');

    // Carga el archivo Markdown
    fetch(markdownFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo. Estado: ${response.status}`);
            }
            return response.text();
        })
        .then(markdownText => {
            // Convierte el texto Markdown a HTML
            var converter = new showdown.Converter();
            var html = converter.makeHtml(markdownText);

            // Inserta el HTML en el contenedor
            markdownContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error al cargar el archivo Markdown:', error);
            markdownContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
        });
});
