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

function deleteCheckedFiles() {
    const checkboxes = document.querySelectorAll('#fileList input[type="checkbox"]:checked');
    // const checkboxes = document.querySelectorAll('.fileCheckbox');
    const filesToDelete = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    console.log('Files to delete:', filesToDelete);

    // Make a POST request to delete the files
    fetch('/deleteFile/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: filesToDelete }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            // Refresh the file list after deletion
            location.reload();
        })
        .catch(error => console.error('Error deleting files:', error));
}

function confirmFileDeletion() {
    const checkboxes = document.querySelectorAll('#fileList input[type="checkbox"]:checked');
    const filesToDelete = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (filesToDelete.length > 0) {
        // Display a confirmation dialog or directly delete files
        deleteCheckedFiles();
    } else {
        // Provide feedback to the user (e.g., show an alert)
        alert('No files selected for deletion.');
    }
}

function goToFilesPage() {
    window.location.href = '/filesPage';
}

// function confirmFileDeletion() {
//     toggleFileToDelete();
//     openConfirmationDialog();
// }

function toggleFileToDelete() {
    // const checkbox = document.querySelector(`.fileCheckbox[data-file-id="${fileId}"]`);

    // if (checkbox) {
    //     checkbox.checked = !checkbox.checked;
    // }
}