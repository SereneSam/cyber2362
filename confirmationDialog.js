document.getElementById('confirmationDialogContainer').innerHTML = '<object type="text/html" data="confirmationDialog.html"></object>';

function deleteFile() {
    fileManager.deleteFile(fileNameToDelete);
    console.log(fileNameToDelete + " deleted!");
    closeConfirmationDialog();
}

function confirmFileDeletion(fileName) {
    openConfirmationDialog(fileName);
}

function closeConfirmationDialog() {
    document.getElementById('confirmationDialogContainer').style.display = 'none';
}

function openConfirmationDialog(fileName) {
    document.getElementById('fileNameToDelete').textContent = fileName;
    document.getElementById('confirmationDialogContainer').style.display = 'block';
}
