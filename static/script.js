document.getElementById('uploadButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            // Leer archivo CSV
            Papa.parse(file, {
                complete: function(results) {
                    console.log(results);
                    const validData = validateData(results.data);
                    extractUniqueValues(validData);
                    originalData = validData; // Guardar datos originales
                    showPreview(validData, results.meta.fields);
                    showNotification('Archivo CSV cargado con éxito.');
                },
                header: true // Esto mantiene las cabeceras del CSV
            });
        } else if (fileExtension === 'xlsx') {
            // Leer archivo Excel
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                // Extraer los datos y los formatos
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });
                console.log(jsonData);
                
                // Separar cabeceras y datos
                const headers = jsonData[0];
                const dataWithoutHeaders = jsonData.slice(1);

                // Validar y mostrar datos
                const validData = validateData(dataWithoutHeaders);
                extractUniqueValues(validData.map(row => Object.fromEntries(headers.map((key, i) => [key, row[i]]))));
                originalData = validData.map(row => Object.fromEntries(headers.map((key, i) => [key, row[i]])));
                showPreview(originalData, headers);
                showNotification('Archivo Excel cargado con éxito.');
            };
            reader.readAsArrayBuffer(file);
        } else {
            showNotification('Por favor, sube un archivo CSV o Excel válido.');
        }
    } else {
        showNotification('Por favor, selecciona un archivo primero.');
    }
});

// Función para validar los datos sin alterar su formato
function validateData(data) {
    // Filtrar los registros vacíos
    return data.filter(row => {
        return row && row.length && row.some(cell => cell !== null && cell !== "");
    });
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    notification.classList.add('visible');

    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('visible');
        notification.classList.add('hidden');
    }, 3000);
}

function showPreview(data, headers) {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = ''; // Limpiar contenido previo
    const previewTitle = document.createElement('h3');
    previewTitle.textContent = 'Vista Previa de Registros:';
    previewContainer.appendChild(previewTitle);
    
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    
    // Verificar y mostrar las cabeceras
    if (headers && headers.length > 0) {
        headers.forEach(header => {
            const headerCell = document.createElement('th');
            headerCell.textContent = header; // Usar las cabeceras originales
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);
    } else {
        console.error("No se encontraron cabeceras.");
    }
    
    // Mostrar hasta 3 registros
    const rowsToShow = Math.min(data.length, 3);
    for (let i = 0; i < rowsToShow; i++) {
        const row = document.createElement('tr');
        Object.values(data[i]).forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = value; // Mostrar el valor tal como es
            row.appendChild(cell);
        });
        table.appendChild(row);
    }
    
    previewContainer.appendChild(table);
    
    // Agregar un botón para ocultar los datos
    const hideButton = document.createElement('button');
    hideButton.textContent = 'Ocultar Datos';
    hideButton.addEventListener('click', function() {
        previewContainer.innerHTML = ''; // Limpiar el contenedor de vista previa
        showNotification('Datos ocultos.');
    });
    previewContainer.appendChild(hideButton);
}

// Obtener las áreas y los responsables únicos al cargar el archivo
function extractUniqueValues(data) {
    const areas = new Set();
    const responsables = new Set();
    
    data.forEach(row => {
        if (row["Área"]) areas.add(row["Área"]);
        if (row["Responsable"]) responsables.add(row["Responsable"]);
    });

    populateFilterOptions('areaFilter', Array.from(areas));
    populateFilterOptions('responsibleFilter', Array.from(responsables));
}

// Llenar los selectores con opciones únicas
function populateFilterOptions(filterId, options) {
    const filter = document.getElementById(filterId);
    filter.innerHTML = ''; // Limpiar opciones existentes
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        filter.appendChild(optElement);
    });
}

// Aplicar filtros y mostrar resultados actualizados
function applyFilters() {
    const selectedAreas = Array.from(document.getElementById('areaFilter').selectedOptions).map(opt => opt.value);
    const selectedResponsibles = Array.from(document.getElementById('responsibleFilter').selectedOptions).map(opt => opt.value);

    const filteredData = originalData.filter(row => {
        const matchesArea = selectedAreas.length === 0 || selectedAreas.includes(row["Área"]);
        const matchesResponsible = selectedResponsibles.length === 0 || selectedResponsibles.includes(row["Responsable"]);
        return matchesArea && matchesResponsible;
    });

    showPreview(filteredData); // Actualizar vista previa con los datos filtrados
}

// Eventos de botones de filtro
document.getElementById('applyAreaFilter').addEventListener('click', applyFilters);
document.getElementById('applyResponsibleFilter').addEventListener('click', applyFilters);

// Restablecer filtros
function resetFilters() {
    document.getElementById('areaFilter').value = '';
    document.getElementById('responsibleFilter').value = '';
    showPreview(originalData); // Mostrar todos los datos
}

document.getElementById('resetAreaFilter').addEventListener('click', resetFilters);
document.getElementById('resetResponsibleFilter').addEventListener('click', resetFilters);
