// hostscript.jsx - Varianta "Smart Regex" (Doar sufixe numerice)

function getProjectPath() {
    if (app.project && app.project.path) {
        return app.project.path;
    }
    return ""; 
}

function importFileSafe(filePath, binName) {
    try {
        app.enableQE(); 
        if (!app.project) return;

        var targetBin = findOrCreateBin(binName);
        
        if (targetBin) {
            var simpleFileName = filePath.replace(/\\/g, "/").split('/').pop();

            // Verificăm dacă există
            if (isMediaAlreadyInBin(targetBin, filePath, simpleFileName)) {
                return "Skipped (Exists)";
            }

            var importSuccess = app.project.importFiles([filePath], 1, targetBin, 0);
            return importSuccess ? "Success" : "Fail";
        } 
    } catch (err) {
        // Silent fail
    }
}

// Funcția care vorbește cu sistemul de notificări Adobe
function showNativeNotification(message, type) {
    // type poate fi: 'info', 'warning', 'error'
    // 'warning' apare galben și e cel mai vizibil
    // 'error' apare roșu
    // 'info' apare doar în Events Panel (uneori nu dă pop-up)
    
    var eventType = 'info';
    if (type === 'error') eventType = 'error';
    if (type === 'warning') eventType = 'warning';

    // Asta e comanda magică
    if(!app.setSDKEventMessage(message, eventType)) console.error("setSDKEventMessage failed.");
}

// --- LOGICA DE DUPLICATE ---
function importFileWithBin(filePath, binName) {
    try {
        app.enableQE(); 
        if (!app.project) return "Nu ai proiect deschis";

        var targetBin = findOrCreateBin(binName);
        
        if (targetBin) {
            // Extragem doar numele fisierului (ex: "carmen.png")
            var simpleFileName = filePath.replace(/\\/g, "/").split('/').pop();

            // VERIFICARE DUBLĂ (Cale SAU Nume)
            if (isMediaAlreadyInBin(targetBin, filePath, simpleFileName)) {
                return "Skipped (Exists)";
            }

            var importSuccess = app.project.importFiles([filePath], 1, targetBin, 0);
            return importSuccess ? "Success" : "Fail la import";
        } 
    } catch (err) {
        // alert("Eroare: " + err.toString());
    }
}

function isMediaAlreadyInBin(bin, sourcePath, simpleFileName) {
    // 1. Pregătim calea de pe disk pentru comparație
    var normalizedSource = sourcePath.toString().replace(/\\/g, "/").toLowerCase();
    // 2. Pregătim numele simplu (pentru planul B)
    var normalizedName = simpleFileName.toString().toLowerCase();

    for (var i = 0; i < bin.children.numItems; i++) {
        var item = bin.children[i];
        
        if (item.type === 1) { // Doar clipuri
            
            // --- VERIFICAREA 1: CALEA (PATH) ---
            var itemPath = item.getMediaPath();
            if (itemPath) {
                var decodedPath = decodeURIComponent(itemPath.toString());
                var normalizedItemPath = decodedPath.replace(/\\/g, "/").toLowerCase();
                
                if (normalizedItemPath === normalizedSource) {
                    return true; // L-am găsit după cale!
                }
            }

            // --- VERIFICAREA 2: NUMELE (PLANUL B) ---
            // Dacă calea a eșuat (din motive dubioase), verificăm dacă are același nume.
            // Asta te scapă de duplicatele la reload.
            if (item.name.toLowerCase() === normalizedName) {
                return true; // L-am găsit după nume!
            }
        }
    }
    return false; // Nu e nici după cale, nici după nume -> Importă-l!
}

// Funcție care scoate extensia
function removeExtension(fileName) {
    var lastDot = fileName.lastIndexOf('.');
    if (lastDot > -1) {
        return fileName.substring(0, lastDot);
    }
    return fileName;
}

// Funcție care scoate DOAR sufixul numeric (_1, _2, _99)
function removeAdobeSuffix(name) {
    // REGEX EXPLICAT:
    // _   -> caută un underscore
    // \d+ -> urmat de una sau mai multe cifre (0-9)
    // $   -> care sunt FIX la finalul textului
    return name.replace(/_\d+$/, "");
}

function findOrCreateBin(name) {
    var root = app.project.rootItem;
    var foundBin = null;
    for (var i = 0; i < root.children.numItems; i++) {
        var item = root.children[i];
        if (item.type === 2 && item.name === name) {
            foundBin = item;
            break;
        }
    }
    if (!foundBin) {
        foundBin = root.createBin(name);
    }
    return foundBin;
}

// --- Funcții Delete ---
function getSelectedFilePaths() {
    var viewIDs = app.getProjectViewIDs();
    if (viewIDs.length === 0) return '[]';
    var selectedItems = app.getProjectViewSelection(viewIDs[0]);
    if (!selectedItems || selectedItems.length === 0) return '[]';
    var paths = [];
    for (var i = 0; i < selectedItems.length; i++) {
        var item = selectedItems[i];
        if (item.type === 1 && item.getMediaPath()) { 
             paths.push(item.getMediaPath().replace(/\\/g, "\\\\"));
        }
    }
    var json = "[";
    for (var j = 0; j < paths.length; j++) {
        json += '"' + paths[j] + '"';
        if (j < paths.length - 1) json += ",";
    }
    json += "]";
    return json;
}

function deleteSelectedItems() {
    app.enableQE();
    qe.project.deleteSelection(); 
}