document.addEventListener('DOMContentLoaded', () => {
  // Referencias a botones y elementos de la pestaña "Backup"
  const importDataButton = document.getElementById('import-data');
  const importFileInput = document.getElementById('import-file');
  const clearMemoryButton = document.getElementById('clear-memory');
  const exportDataButton = document.getElementById('export-data'); // Botón para exportar datos

  // Botones de cierre de los modales
  const modalCloseButtons = document.querySelectorAll('.close-modal');
  const modalCancelButton = document.getElementById('modal-cancel');
  const modal = document.getElementById('modal');

  // Función para cerrar cualquier modal
  function closeModal(targetModal) {
    if (targetModal) {
      targetModal.style.display = 'none';
    }
  }

  // Botón "X" para cerrar modales
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
      closeModal(modal);
    });
  });

  // Botón "Cancelar" del modal genérico
  if (modalCancelButton) {
    modalCancelButton.addEventListener('click', () => {
      closeModal(modal);
    });
  }

  // Evento para "Exportar Datos"
  if (exportDataButton) {
    exportDataButton.addEventListener('click', () => {
      chrome.storage.sync.get(null, (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Crear un enlace para la descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = 'regex_backup.json';
        a.click();

        URL.revokeObjectURL(url);
        showToast('✅ Datos exportados correctamente.');
      });
    });
  }

  // Evento para "Importar Datos"
  if (importDataButton) {
    importDataButton.addEventListener('click', () => {
      const file = importFileInput?.files[0];
      if (!file) {
        showModal('⚠️ Selecciona un archivo antes de importar.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          chrome.storage.sync.set(importedData, () => {
            loadDomains();
            loadSavedRegexes();
            showToast('✅ Datos importados correctamente.');
          });
        } catch (error) {
          showToast('❌ Error al importar datos: archivo no válido.');
        }
      };

      reader.readAsText(file);
    });
  }

  // Evento para "Limpiar Memoria"
  if (clearMemoryButton) {
    clearMemoryButton.addEventListener('click', () => {
      showModal('⚠️ ¿Estás seguro de que deseas borrar toda la memoria?', {
        showConfirm: true,
        showCancel: true,
        onConfirm: () => {
          chrome.storage.sync.clear(() => {
            loadDomains();
            loadSavedRegexes();
            showToast('🚮 Toda la memoria fue eliminada.');
          });
        },
      });
    });
  }
});

// popup.js

document.addEventListener('DOMContentLoaded', () => {
  console.log("Inicializando el popup..."); // Depuración
  loadDomains(); // Carga los dominios guardados en el selector
  domainSelect.addEventListener('change', loadSavedRegexes); // Escuchar cambios en dominio
  verSearchType.addEventListener('change', loadSavedRegexes); // Escuchar cambios en tipo de búsqueda
  modal.style.display = 'none';
  aboutModal.style.display = 'none';
});


document.addEventListener('DOMContentLoaded', () => {
  const buttonGroup = document.querySelector('.button-group'); // Contenedor de los botones

  if (buttonGroup) {
    buttonGroup.addEventListener('click', (event) => {
      // Verifica si el elemento clicado es un botón
      if (event.target.classList.contains('btn')) {
        // Desactivar todos los botones
        const buttons = buttonGroup.querySelectorAll('.btn');
        buttons.forEach(button => button.classList.remove('btn-active'));

        // Activar el botón seleccionado
        event.target.classList.add('btn-active');

        // Obtener el valor del botón seleccionado
        const selectedAccount = event.target.dataset.value;

        // Guardar la selección en chrome.storage.sync
        chrome.storage.sync.set({ domainAccountMapping: selectedAccount }, () => {
          console.log(`Cuenta seleccionada: ${selectedAccount}`);
        });

        // Acción específica para la cuenta predeterminada
        if (selectedAccount === '0') {
          console.log('Se ha seleccionado la cuenta predeterminada.');
        }
      }
    });
  } else {
    console.error('El contenedor de botones ".button-group" no se encontró en el DOM.');
  }
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

// function updateVisibility() {
//   const settingsTab = document.getElementById('settings'); // Contenedor Ajustes
//   const verTab = document.getElementById('ver'); // Contenedor Ver
//   const domainAccountLink = document.getElementById('domain-account-link'); // Botonera Multicuenta

//   // Mostrar ajustes solo en la pestaña "Ajustes"
//   if (settingsTab && settingsTab.classList.contains('active')) {
//     settingsTab.style.display = 'block';
//   } else {
//     settingsTab.style.display = 'none';
//   }

//   // Verificar si multicuenta está habilitado y la pestaña activa es "Ver"
//   chrome.storage.sync.get(['multiaccountEnabled'], (result) => {
//     const multiaccountEnabled = result.multiaccountEnabled || false;

//     if (multiaccountEnabled && verTab && verTab.classList.contains('active')) {
//       domainAccountLink.style.display = 'flex'; // Mostrar botonera si está en la pestaña Ver y multicuenta está activa
//     } else {
//       domainAccountLink.style.display = 'none'; // Ocultar en cualquier otro caso
//     }
//   });
// }

function updateVisibility() {
  const settingsTab = document.getElementById('settings'); // Ajustes
  const verTab = document.getElementById('ver'); // Ver

  // Mostrar ajustes solo en la pestaña de Ajustes
  if (settingsTab && settingsTab.classList.contains('active')) {
    settingsTab.style.display = 'block';
  } else {
    settingsTab.style.display = 'none';
  }
}



// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  updateVisibility();
});


// Cambiar entre pestañas
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (event) => {
    const selectedTab = event.target.dataset.tab;

    // Quitar la clase 'active' de todas las pestañas y secciones
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#crear, #ver, #backup, #settings').forEach(section => {
      section.classList.remove('active');
    });

    // Activar la pestaña y la sección correspondientes
    event.target.classList.add('active');
    document.getElementById(selectedTab).classList.add('active');

    // Actualizar visibilidad según la pestaña activa
    updateVisibility();
  });
});

// Actualizar la visibilidad al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  updateVisibility();
});


document.addEventListener('DOMContentLoaded', () => {
  updateVisibility();
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

  // Guardar el dominio o URL en una lista separada
  chrome.storage.sync.get(['domains'], (result) => {
    const domains = result.domains || [];
    if (!domains.includes(domain)) {
      domains.push(domain);
      chrome.storage.sync.set({ domains }, () => {
        console.log("Dominio/URL guardado correctamente:", domain);
        loadDomains(); // Recargar dominios actualizados
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
        <div class="regex-item">
          <p>
            Regex: <strong>${regex}</strong>
            <button class="open-link" data-domain="${domain}" data-type="${searchType}" data-regex="${regex}">Abrir Link</button>
            <button class="edit-regex" data-index="${index}" data-key="${key}">Editar</button>
            <button class="delete-regex" data-index="${index}" data-key="${key}">Eliminar</button>
          </p>
        </div>
      `).join('');
    }

    // Configurar eventos de clic para los botones generados
    document.querySelectorAll('.open-link').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const domain = link.dataset.domain;
        const searchType = link.dataset.type;
        const regex = link.dataset.regex;

        generateUrl(domain, searchType, regex, (url) => {
          if (url) {
            window.open(url, '_blank');
          } else {
            console.error('No se pudo generar la URL');
          }
        });
      });
    });

    document.querySelectorAll('.edit-regex').forEach(button => {
      button.addEventListener('click', editRegex);
    });
    
    document.querySelectorAll('.delete-regex').forEach(button => {
      button.addEventListener('click', deleteRegex);
    });
    
  });
}



document.querySelectorAll('.open-link').forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault(); // Evitar el comportamiento predeterminado del enlace

    const domain = link.dataset.domain; // Obtener dominio del botón
    const searchType = link.dataset.type; // Obtener tipo de búsqueda (page/query)
    const regex = link.dataset.regex; // Obtener regex asociado

    // Generar la URL y abrirla
    generateUrl(domain, searchType, regex, (url) => {
      if (url) {
        window.open(url, '_blank'); // Abrir la URL generada en una nueva pestaña
      } else {
        console.error('No se pudo generar la URL');
      }
    });
  });
});


// Función para eliminar regex
function deleteRegex(event) {
  const key = event.target.dataset.key;
  const index = event.target.dataset.index;

  chrome.storage.sync.get([key], (result) => {
    const savedData = result[key] || [];
    savedData.splice(index, 1); // Eliminar el regex de la lista

    if (savedData.length === 0) {
      // Si ya no hay regex, elimina la clave y verifica el dominio
      chrome.storage.sync.remove([key], () => {
        console.log(`Regex eliminado. La clave ${key} ha sido eliminada.`);
        const domain = key.split('-')[0]; // Extraer el dominio de la clave

        chrome.storage.sync.get(['domains'], (result) => {
          const domains = result.domains || [];
          const updatedDomains = domains.filter(d => d !== domain);

          chrome.storage.sync.set({ domains: updatedDomains }, () => {
            console.log(`Dominio ${domain} eliminado de la lista de dominios.`);
            loadDomains(); // Recargar dominios actualizados
          });
        });
      });
    } else {
      // Si aún quedan regex, actualiza la lista
      chrome.storage.sync.set({ [key]: savedData }, () => {
        console.log("Regex actualizado después de eliminar:", savedData);
      });
    }

    loadSavedRegexes(); // Recargar los regex visibles
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
    if (newRegex !== null && newRegex.trim() !== '') {
      savedData[index] = newRegex.trim(); // Actualizar el regex
      chrome.storage.sync.set({ [key]: savedData }, () => {
        console.log("Regex editado:", savedData);
        loadSavedRegexes(); // Recargar los regex visibles
      });
    } else {
      console.log("Edición cancelada o regex vacío.");
    }
  });
}

// Generar la URL de Search Console
function generateUrl(domain, searchType, regex, callback) {
  const isUrlProperty = domain.startsWith('https://') || domain.startsWith('http://');
  const encodedDomain = encodeURIComponent(domain);

  const baseUrl = isUrlProperty
    ? `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodedDomain}`
    : `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3A${encodedDomain}`;

  let url = '';
  if (searchType === 'page') {
    url = `${baseUrl}&page=~${encodeURIComponent(regex)}`;
  } else if (searchType === 'query') {
    url = `${baseUrl}&query=~${encodeURIComponent(regex)}`;
  }

  // Obtener el índice de usuario
  chrome.storage.sync.get(['multiaccountEnabled', 'domainAccountMapping'], (result) => {
    const accountIndex = result.multiaccountEnabled ? (result.domainAccountMapping || '0') : '0';

    // Si es `u=0`, omitir el segmento `/u/0/` y `&u=0`
    if (accountIndex === '0') {
      callback(url); // Retornar URL sin especificar usuario
    } else {
      // Si es cualquier otro usuario, incluir `/u/{index}/` y `&u={index}`
      const fullUrl = `https://search.google.com/u/${accountIndex}/search-console/performance/search-analytics?${url.split('?')[1]}&u=${accountIndex}`;
      callback(fullUrl);
    }
  });
}


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

document.addEventListener('DOMContentLoaded', () => {
  const multiaccountCheckbox = document.getElementById('enable-multiaccount');
  const domainAccountLink = document.getElementById('domain-account-link'); // Botonera

  // Cargar configuración inicial desde chrome.storage.sync
  chrome.storage.sync.get(['multiaccountEnabled'], (result) => {
    const multiaccountEnabled = result.multiaccountEnabled || false;
    multiaccountCheckbox.checked = multiaccountEnabled;
    domainAccountLink.style.display = multiaccountEnabled ? 'flex' : 'none'; // Mostrar/Ocultar la botonera
  });

  // Cambiar visibilidad del sistema de multicuenta
  multiaccountCheckbox.addEventListener('change', () => {
    const isEnabled = multiaccountCheckbox.checked;

    chrome.storage.sync.set({ multiaccountEnabled: isEnabled }, () => {
      console.log(`Sistema de multicuenta ${isEnabled ? 'activado' : 'desactivado'}`);
      showToast(isEnabled ? '✅ Sistema de multicuenta activado' : '🚫 Sistema de multicuenta desactivado');

      // Mostrar/Ocultar la botonera según el estado
      domainAccountLink.style.display = isEnabled ? 'flex' : 'none';
    });
  });
});



document.addEventListener('DOMContentLoaded', () => {
  const buttonGroup = document.getElementById('domain-account-link');

  // Cargar la cuenta activa desde chrome.storage.sync
  chrome.storage.sync.get(['domainAccountMapping'], (result) => {
    const activeAccount = result.domainAccountMapping || '0'; // Por defecto la primera cuenta
    const buttons = buttonGroup.querySelectorAll('.btn');
    buttons.forEach(button => {
      if (button.dataset.value === activeAccount) {
        button.classList.add('btn-active');
      } else {
        button.classList.remove('btn-active');
      }
    });
  });

  // Configurar eventos de clic para los botones
  buttonGroup.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn')) {
      const buttons = buttonGroup.querySelectorAll('.btn');

      // Desactivar todos los botones
      buttons.forEach(button => button.classList.remove('btn-active'));

      // Activar el botón seleccionado
      event.target.classList.add('btn-active');

      // Guardar la selección en chrome.storage.sync
      const selectedAccount = event.target.dataset.value;
      chrome.storage.sync.set({ domainAccountMapping: selectedAccount }, () => {
        console.log(`Cuenta seleccionada: ${selectedAccount}`);
      });
    }
  });
});
