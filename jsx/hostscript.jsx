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

// --- LOGICA DE DUPLICATE ---
function isMediaAlreadyInBin(bin, sourcePath, sourceFileName) {
    // 1. Pregătim numele de pe hard (fără extensie)
    // Ex: "Vacanța_2023.mp4" -> "Vacanța_2023"
    var sourceBase = removeExtension(sourceFileName).toLowerCase();
    
    // Pregătim și calea full (Planul A - cel mai sigur)
    var normalizedSourcePath = sourcePath.toString().replace(/\\/g, "/").toLowerCase();

    for (var i = 0; i < bin.children.numItems; i++) {
        var item = bin.children[i];
        
        if (item.type === 1) { // Doar clipuri
            
            // --- VERIFICAREA 1: CALEA (CNP-ul) ---
            var itemPath = item.getMediaPath();
            if (itemPath) {
                var normalizedItemPath = decodeURIComponent(itemPath.toString()).replace(/\\/g, "/").toLowerCase();
                if (normalizedItemPath === normalizedSourcePath) return true;
            }

            // --- VERIFICAREA 2: NUME SMART (Ce ai cerut tu) ---
            var itemBase = removeExtension(item.name).toLowerCase();

            // Cazul A: Nume identic (Ex: "Logo" === "Logo")
            if (itemBase === sourceBase) {
                return true;
            }

            // Cazul B: Nume cu sufix Adobe (Ex: "Logo_1" vs "Logo")
            // Curățăm sufixul doar din numele itemului din Bin
            var itemBaseCleaned = removeAdobeSuffix(itemBase);
            
            if (itemBaseCleaned === sourceBase) {
                // Bingo! Itemul din Bin e doar o copie numerotată a fișierului nostru.
                return true; 
            }
        }
    }
    return false;
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