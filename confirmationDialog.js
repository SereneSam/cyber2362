
// confirmationDialog.js

document.getElementById('confirmationDialogContainer').innerHTML = '<object type="text/html" data="confirmationDialog.html"></object>';

let filesToDelete = [];

function deleteFiles() {
    fetch('/deleteFiles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: filesToDelete }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        location.reload();
    })
    .catch(error => console.error('Error deleting files:', error));

    closeConfirmationDialog();
}

function confirmFileDeletion() {
    openConfirmationDialog();
}

function closeConfirmationDialog() {
    document.getElementById('confirmationDialogContainer').style.display = 'none';
}

function openConfirmationDialog(fileName) {
    document.getElementById('fileNameToDelete').textContent = fileName;
    document.getElementById('confirmationDialogContainer').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const filesToDeleteList = document.getElementById('filesToDeleteList');

    filesToDelete.forEach(file => {
        const listItem = document.createElement('li');
        listItem.textContent = file;
        filesToDeleteList.appendChild(listItem);
    });
});