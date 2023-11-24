function showFileExplorer() {
    // Redirect to the file explorer page
    window.location.href = '/fileExplorer';
}

const fs = require('fs');

const uploadPath = './uploaded_files';
const files = fs.readdirSync(uploadPath);

// Display files
const fileList = document.getElementById('fileList');

files.forEach(file => {
    const listItem = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = file;
    listItem.appendChild(checkbox);
    listItem.appendChild(document.createTextNode(file));
    fileList.appendChild(listItem);
});

function goToUploadPage() {
    window.location.href = '/filesPage';
}

function deleteSelectedFiles() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');

    checkboxes.forEach((checkbox) => {
        const fileName = checkbox.value;
        console.log(`Deleting file: ${fileName}`);
    });
    location.reload();
}