// upload.js

function uploadFile() {
    var fileInput = document.getElementById('UploadButton');
    var fileList = document.getElementById('fileList');

    var files = fileInput.files;

    for (var i = 0; i < files.length; i++) {
        var fileName = files[i].name;

        if (!fileExists(fileName)) {
            var listItem = document.createElement('li');
            listItem.className = 'fileItem';

            var deleteButton = document.createElement('span');
            deleteButton.className = 'deleteButton';
            deleteButton.innerHTML = 'Delete';
            deleteButton.onclick = function () {
                deleteFile(fileName);
            };

            listItem.innerHTML = fileName;
            listItem.appendChild(deleteButton);

            fileList.appendChild(listItem);
        }
    }
}

function fileExists(fileName) {
    var fileItems = document.getElementsByClassName('fileItem');
    for (var i = 0; i < fileItems.length; i++) {
        if (fileItems[i].textContent.includes(fileName)) {
            return true;
        }
    }
    return false;
}

function deleteFile(fileName) {
    var fileItems = document.getElementsByClassName('fileItem');
    for (var i = 0; i < fileItems.length; i++) {
        var itemFileName = fileItems[i].getAttribute('data-filename');
        if (itemFileName === fileName) {
            fileItems[i].remove();
            break;
        }
    }
}
