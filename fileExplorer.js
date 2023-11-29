function showFileExplorer() {
    // Redirect to the file explorer page
    window.location.href = '/fileExplorer';
}

// Display files
document.addEventListener('DOMContentLoaded', () => {
    displayFileList();
});

function displayFileList() {
    // Display files
    let fileList = document.getElementById('fileList');

    if (!fileList) {
        fileList = document.createElement('ul');
        fileList.id = 'fileList';
        document.body.appendChild(fileList);
    }

    // Fetch files from the server
    fetch('/fileList')
        .then(response => response.json())
        .then(files => {
            // Files with checkboxes
            files.forEach(file => {
                const listItem = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = file;
                listItem.appendChild(checkbox);
                listItem.appendChild(document.createTextNode(file));
                fileList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error fetching files:', error));
}

function goToFilesPage() {
    window.location.href = '/filesPage';
}

function confirmFileDeletion() {
    toggleFileToDelete();
    openConfirmationDialog();
}