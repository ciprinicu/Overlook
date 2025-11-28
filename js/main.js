const csInterface = new CSInterface();
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");

let activeWatchers = [];
let currentProjectKey = "";

// 1. Inițializare la Start
initExtension();

function initExtension() {
  // Cerem calea proiectului pentru a încărca setările corecte
  csInterface.evalScript("getProjectPath()", (result) => {
    if (!result || result === "") {
      document.getElementById("status").innerText =
        "⚠️ Salvează proiectul pentru a activa memoria!";
      return;
    }
    currentProjectKey = result.replace(/\\/g, "/");
    loadSettings();
  });
}

// 2. Butonul Adaugă Folder
document.getElementById("btnAdd").addEventListener("click", () => {
  if (!currentProjectKey) {
    alert("Salvează proiectul întâi!");
    initExtension();
    return;
  }

  const result = window.cep.fs.showOpenDialogEx(
    false,
    true,
    "Alege folder",
    null
  );
  if (result.data && result.data.length > 0) {
    const folderPath = result.data[0];
    const defaultBin = path.basename(folderPath);
    const binName = prompt("Nume Bin în Premiere:", defaultBin);

    if (binName) {
      addWatcherRule(folderPath, binName, true);
    }
  }
});

// 3. Logica de Watcher
function addWatcherRule(folderPath, binName, doSave = true) {
  // Evităm duplicatele în listă
  if (activeWatchers.find((w) => w.path === folderPath)) {
    alert("Folderul este deja monitorizat!");
    return;
  }

  // UI
  const list = document.getElementById("listaPaza");
  const div = document.createElement("div");
  div.className = "watcher-item";
  div.innerHTML = `
        <div class="watcher-info">
            <span class="bin-tag">📁 ${binName}</span>
            <span class="path-tag">${folderPath}</span>
        </div>
        <div class="remove-btn" title="Oprește Sync">✕</div>
    `;

  div.querySelector(".remove-btn").addEventListener("click", () => {
    stopWatcher(folderPath);
    div.remove();
    saveSettings();
  });
  list.appendChild(div);

  // Pornim Chokidar
  startChokidar(folderPath, binName);

  if (doSave) saveSettings();
}

function startChokidar(folderPath, targetBinName) {
  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // Ignoră fișiere ascunse
    persistent: true,
    ignoreInitial: false, // IMPORTĂ TOT ce e deja acolo (Mirroring)
    depth: 0, // Doar folderul curent, fără subfoldere (schimbă dacă vrei recursiv)
  });

  watcher.on("add", (filePath) => {
    // Normalizăm calea pentru Adobe (slash normal /)
    const cleanPath = filePath.replace(/\\/g, "/");

    console.log(cleanPath);

    // Update UI status
    document.getElementById("status").innerText = `Sync: ${path.basename(
      filePath
    )}`;

    // Trimitem comanda securizată cu JSON.stringify
    const argPath = JSON.stringify(cleanPath);
    const argBin = JSON.stringify(targetBinName);

    csInterface.evalScript(
      `importFileSafe(${argPath}, ${argBin})`,
      (result) => {
        const fileName = path.basename(cleanPath);

        if (result === "Success") {
          // Mesaj Nativ de la Premiere (INFO)
          // Nota: Info apare uneori doar în Events Panel.
          // Dacă vrei să fii sigur că se vede, poți folosi 'warning' (galben),
          // deși e cam agresiv.
          csInterface.evalScript(
            `showNativeNotification("Overlook File ${fileName} imported in ${argBin}", "info")`
          );

          // Actualizăm și textul mic din panel
          document.getElementById("status").innerText = `✅ ${fileName}`;
        } else if (result === "Fail") {
          // Mesaj Nativ de Eroare (ROȘU)
          csInterface.evalScript(
            `showNativeNotification("Eroare la import: ${fileName}", "error")`
          );
        }
      }
    );
  });

  watcher.on("unlink", (filePath) => {
    // Normalizăm calea pentru Adobe (slash normal /)
    const cleanPath = filePath.replace(/\\/g, "/");

    console.log(cleanPath);

    // Update UI status
    document.getElementById("status").innerText = `Delete: ${path.basename(
      filePath
    )}`;

    // Trimitem comanda securizată cu JSON.stringify
    const argPath = JSON.stringify(cleanPath);
    const argBin = JSON.stringify(targetBinName);

    //csInterface.evalScript(`importFileSafe(${argPath}, ${argBin})`);
  });

  activeWatchers.push({
    path: folderPath,
    bin: targetBinName,
    instance: watcher,
  });
}

function stopWatcher(folderPath) {
  const index = activeWatchers.findIndex((w) => w.path === folderPath);
  if (index > -1) {
    activeWatchers[index].instance.close();
    activeWatchers.splice(index, 1);
  }
}

// 4. Persistence (Local Storage per Proiect)
function saveSettings() {
  if (!currentProjectKey) return;
  const data = activeWatchers.map((w) => ({ path: w.path, bin: w.bin }));
  localStorage.setItem("wt_v2_" + currentProjectKey, JSON.stringify(data));
}

function loadSettings() {
  const raw = localStorage.getItem("wt_v2_" + currentProjectKey);
  if (raw) {
    const data = JSON.parse(raw);
    data.forEach((item) => addWatcherRule(item.path, item.bin, false));
  }
}

// 5. Butonul Delete de pe Disk
document.getElementById("btnDelete").addEventListener("click", () => {
  csInterface.evalScript("getSelectedFilePaths()", (res) => {
    if (!res || res === "[]") {
      alert("Nu ai selectat niciun fișier în Bin!");
      return;
    }

    const files = JSON.parse(res);
    if (
      confirm(
        `⚠️ Ești sigur că ștergi ${files.length} fișiere DEFINITIV de pe hard disk?\nNu se pot recupera!`
      )
    ) {
      let count = 0;
      files.forEach((f) => {
        try {
          if (fs.existsSync(f)) {
            fs.unlinkSync(f);
            count++;
          }
        } catch (e) {
          console.error(e);
        }
      });

      // După ce le ștergem fizic, le scoatem și din Premiere
      csInterface.evalScript("deleteSelectedItems()");
      alert(`S-au șters ${count} fișiere.`);
    }
  });
});
