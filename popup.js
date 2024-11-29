// popup.js

document.addEventListener('DOMContentLoaded', () => {
  console.log("Inicializando el popup..."); // Depuración
  loadDomains(); // Carga los dominios guardados en el selector
  domainSelect.addEventListener('change', loadSavedRegexes); // Escuchar cambios en dominio
  verSearchType.addEventListener('change', loadSavedRegexes); // Escuchar cambios en tipo de búsqueda
  modal.style.display = 'none';
  aboutModal.style.display = 'none';
});

// Referencias a elementos HTML
const tabs = document.querySelectorAll('.tab');
const crearTab = document.getElementById('crear');
const verTab = document.getElementById('ver');
const searchTypeInput = document.getElementById('search-type');
const regexInput = document.getElementById('regex-input');
const saveButton = document.getElementById('save-regex');
const domainSelect = document.getElementById('domain-select');
const verSearchType = document.getElementById('ver-search-type');
const savedRegexes = document.getElementById('saved-regexes');

// Alternar entre pestañas
const sections = document.querySelectorAll('div[id]');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remover la clase 'active' de todas las pestañas y secciones
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));

    // Agregar la clase 'active' a la pestaña y sección correspondiente
    tab.classList.add('active');
    const tabId = tab.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});


// Guardar regex
saveButton.addEventListener('click', () => {
  const domain = domainInput.value.trim();
  const searchType = searchTypeInput.value;
  const regex = regexInput.value.trim();

  if (!domain || !regex) {
    showModal('Por favor, completa todos los campos.', {
      showConfirm: true,
      onConfirm: () => console.log('Campos incompletos.')
    });
    return;
  }

  const key = `${domain}-${searchType}`;

  // Guardar el regex bajo la clave compuesta
  chrome.storage.sync.get([key], (result) => {
    const savedData = result[key] || [];
    savedData.push(regex);
    chrome.storage.sync.set({ [key]: savedData }, () => {
      console.log("Regex guardado:", { key, savedData });
      showToast('Regex guardado correctamente.'); // Mostrar toast
      loadSavedRegexes(); // Actualizar la lista en "Ver"
    });
  });

  // Guardar el dominio en una lista separada
  chrome.storage.sync.get(['domains'], (result) => {
    const domains = result.domains || [];
    if (!domains.includes(domain)) {
      domains.push(domain);
      chrome.storage.sync.set({ domains }, () => {
        console.log("Dominio guardado correctamente:", domain);
        loadDomains(); // Recargar dominios en la pestaña "Ver"
        loadDomainSuggestions(); // Actualizar las sugerencias de autocompletar
      });
    }
  });

  domainInput.value = '';
  regexInput.value = '';
});


// Cargar dominios en el selector
function loadDomains() {
  chrome.storage.sync.get(['domains'], (result) => {
    console.log("Dominios encontrados:", result.domains); // Depuración
    const domains = result.domains || [];
    domainSelect.innerHTML = '<option value="">Selecciona un dominio</option>';
    domains.forEach(domain => {
      domainSelect.innerHTML += `<option value="${domain}">${domain}</option>`;
    });
  });
}

// Cargar regex guardados
function loadSavedRegexes() {
  const domain = domainSelect.value;
  const searchType = verSearchType.value;

  if (!domain) {
    savedRegexes.innerHTML = '<p>Selecciona un dominio para ver los regex.</p>';
    return;
  }

  const key = `${domain}-${searchType}`;
  chrome.storage.sync.get([key], (result) => {
    const savedData = result[key] || [];
    if (savedData.length === 0) {
      savedRegexes.innerHTML = '<p>No hay regex guardados para este dominio y tipo.</p>';
    } else {
      savedRegexes.innerHTML = savedData.map((regex, index) => `
        <div>
          <p>
            Regex: <strong>${regex}</strong>
            <button class="edit-regex" data-index="${index}" data-key="${key}">Editar</button>
            <button class="delete-regex" data-index="${index}" data-key="${key}">Eliminar</button>
          </p>
          <p>
            Ver: <a href="${generateUrl(domain, searchType, regex)}" target="_blank" style="font-weight:bold;">Link</a>
          </p>
        </div>
      `).join('');
    }

    document.querySelectorAll('.delete-regex').forEach(button => {
      button.addEventListener('click', deleteRegex);
    });

    document.querySelectorAll('.edit-regex').forEach(button => {
      button.addEventListener('click', editRegex);
    });
  });
}


// Función para eliminar regex
function deleteRegex(event) {
  const key = event.target.dataset.key;
  const index = event.target.dataset.index;

  chrome.storage.sync.get([key], (result) => {
    const savedData = result[key] || [];
    savedData.splice(index, 1); // Eliminar el regex de la lista
    chrome.storage.sync.set({ [key]: savedData }, () => {
      console.log("Regex eliminado:", savedData);
      loadSavedRegexes(); // Recargar los regex
    });
  });
}

// Función para editar regex
function editRegex(event) {
  const key = event.target.dataset.key;
  const index = event.target.dataset.index;

  chrome.storage.sync.get([key], (result) => {
    const savedData = result[key] || [];
    const regexToEdit = savedData[index];

    const newRegex = prompt("Edita tu regex:", regexToEdit);
    if (newRegex !== null) {
      savedData[index] = newRegex; // Actualizar el regex
      chrome.storage.sync.set({ [key]: savedData }, () => {
        console.log("Regex editado:", savedData);
        loadSavedRegexes(); // Recargar los regex
      });
    }
  });
}


// Generar la URL de Search Console
function generateUrl(domain, searchType, regex) {
  const baseUrl = 'https://search.google.com/u/1/search-console/performance/search-analytics?resource_id=sc-domain%3A';
  const encodedDomain = encodeURIComponent(domain);
  const encodedRegex = encodeURIComponent(`~${regex}`);
  if (searchType === 'page') {
    return `${baseUrl}${encodedDomain}&hl=es-ES&breakdown=page&page=${encodedRegex}`;
  } else if (searchType === 'query') {
    return `${baseUrl}${encodedDomain}&hl=es-ES&breakdown=page&query=${encodedRegex}`;
  }
}

// importar
document.getElementById('export-data').addEventListener('click', () => {
  chrome.storage.sync.get(null, (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Crear un enlace para descargar el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regex_backup.json';
    a.click();

    URL.revokeObjectURL(url);

    // Mostrar modal al finalizar la exportación
    showModal('✅ Datos exportados correctamente. El archivo se ha descargado.', {
      showConfirm: true,
      onConfirm: () => console.log('Exportación completada.')
    });
  });
});



//exportar
document.getElementById('import-data').addEventListener('click', () => {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];

  if (!file) {
    // Mostrar modal si no se seleccionó un archivo
    showModal('⚠️ Por favor, selecciona un archivo antes de importar.', {
      showConfirm: true,
      onConfirm: () => console.log('Aviso de archivo faltante mostrado.')
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      // Guardar los datos importados
      chrome.storage.sync.set(importedData, () => {
        showModal('✅ Datos importados correctamente.', {
          showConfirm: true,
          onConfirm: () => {
            loadDomains(); // Recargar dominios actualizados
            console.log('Importación completada.');
          }
        });
      });
    } catch (error) {
      // Mostrar modal en caso de error
      showModal('❌ Error al importar datos: el archivo no es válido.', {
        showConfirm: true,
        onConfirm: () => console.log('Error en la importación mostrado.')
      });
    }
  };

  reader.readAsText(file);
});


// Limpiar la memoria con preaviso
document.getElementById('clear-memory').addEventListener('click', () => {
  showModal('⚠️ ¿Estás seguro de que deseas borrar toda la memoria? Esta acción no se puede deshacer.', {
    showConfirm: true,
    showCancel: true,
    onConfirm: () => {
      chrome.storage.sync.clear(() => {
        console.log("Memoria limpiada.");
        loadDomains(); // Recargar la lista de dominios vacía
        loadSavedRegexes(); // Limpiar visualmente los regex

        // Mostrar toast
        showToast('🚮 Toda la memoria fue eliminada.');
      });
    },
    onCancel: () => {
      console.log("Limpieza de memoria cancelada.");
    }
  });
});


// Referencias al modal y sus elementos
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');
const closeModal = document.querySelector('.close-modal');

// Mostrar la modal
function showModal(message, options = {}) {
  modalMessage.textContent = message;

  // Configurar visibilidad de botones
  modalConfirm.style.display = options.showConfirm ? 'inline-block' : 'none';
  modalCancel.style.display = options.showCancel ? 'inline-block' : 'none';

  // Configurar eventos para Confirmar y Cancelar
  if (options.onConfirm) {
    modalConfirm.onclick = () => {
      options.onConfirm();
      closeModalModal();
    };
  }

  if (options.onCancel) {
    modalCancel.onclick = () => {
      options.onCancel();
      closeModalModal();
    };
  }

  modal.style.display = 'flex'; // Mostrar el modal
}

// Ocultar la modal
function closeModalModal() {
  modal.style.display = 'none'; // Ocultar el modal
  modalConfirm.onclick = null; // Eliminar eventos de Confirmar
  modalCancel.onclick = null; // Eliminar eventos de Cancelar
}

// Cerrar la modal al hacer clic en el botón "X"
closeModal.onclick = closeModalModal;

// Cerrar la modal al hacer clic fuera del contenido
window.onclick = (event) => {
  if (event.target === modal) {
    closeModalModal();
  }
};

// Referencia al modal "Acerca de"
const aboutModal = document.getElementById('about-modal');
const aboutLink = document.getElementById('about-link');

// Mostrar el modal "Acerca de" al hacer clic en el enlace
aboutLink.addEventListener('click', (event) => {
  event.preventDefault(); // Evitar el comportamiento predeterminado del enlace
  aboutModal.style.display = 'flex'; // Mostrar el modal
});

// Cerrar el modal "Acerca de" al hacer clic en el botón de cierre
const closeAboutModal = aboutModal.querySelector('.close-modal');
closeAboutModal.addEventListener('click', () => {
  aboutModal.style.display = 'none';
});

// Cerrar el modal al hacer clic fuera del contenido
window.addEventListener('click', (event) => {
  if (event.target === aboutModal) {
    aboutModal.style.display = 'none';
  }
});


// Función para mostrar un toast
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message; // Agregar el mensaje
  toast.classList.add('show'); // Mostrar el toast

  // Ocultar el toast después de 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    toast.style.display = 'none'; // Asegurarse de ocultarlo completamente
  }, 3000);

  // Asegurarse de que el toast sea visible
  toast.style.display = 'block';
}


function loadDomainSuggestions() {
  chrome.storage.sync.get(['domains'], (result) => {
    const domainList = document.getElementById('domain-list');
    domainList.innerHTML = ''; // Limpiar las sugerencias existentes
    const domains = result.domains || [];
    domains.forEach(domain => {
      const option = document.createElement('option');
      option.value = domain; // Añadir cada dominio como una opción
      domainList.appendChild(option);
    });
  });
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  loadDomainSuggestions();
});


const domainInput = document.getElementById('domain-input');
const domainSuggestions = document.getElementById('domain-suggestions');

// Mostrar sugerencias personalizadas
domainInput.addEventListener('input', () => {
  const query = domainInput.value.toLowerCase().trim();

  // Obtener dominios guardados
  chrome.storage.sync.get(['domains'], (result) => {
    const domains = result.domains || [];
    domainSuggestions.innerHTML = ''; // Limpiar sugerencias

    // Filtrar dominios por la consulta
    const filteredDomains = domains.filter(domain => domain.toLowerCase().includes(query));
    filteredDomains.forEach(domain => {
      const div = document.createElement('div');
      div.textContent = domain;

      // Completar el campo al hacer clic
      div.addEventListener('click', () => {
        domainInput.value = domain;
        domainSuggestions.innerHTML = ''; // Limpiar sugerencias
        domainSuggestions.style.display = 'none'; // Ocultar después de seleccionar
      });

      domainSuggestions.appendChild(div);
    });

    // Mostrar la lista solo si hay sugerencias
    domainSuggestions.style.display = filteredDomains.length > 0 ? 'block' : 'none';
  });
});

// Ocultar sugerencias al hacer clic fuera del input
document.addEventListener('click', (e) => {
  if (e.target !== domainInput) {
    domainSuggestions.innerHTML = '';
    domainSuggestions.style.display = 'none'; // Ocultar contenedor
  }
});
