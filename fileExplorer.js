function showFileExplorer() {
  // Redirect to the file explorer page
  window.location.href = "/fileExplorer";
}

// Display files
document.addEventListener("DOMContentLoaded", () => {
  displayFileList();
});

function displayFileList() {
  // Display files
  let fileList = document.getElementById("fileList");

  if (!fileList) {
    fileList = document.createElement("ul");
    fileList.id = "fileList";
    document.body.appendChild(fileList);
  }

  // Fetch files from the server
  fetch("/fileList")
    .then((response) => response.json())
    .then((files) => {
      // Files with checkboxes
      files.forEach((file) => {
        const listItem = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = file;
        listItem.appendChild(checkbox);
        listItem.appendChild(document.createTextNode(file));
        fileList.appendChild(listItem);
      });
    })
    .catch((error) => console.error("Error fetching files:", error));
}

function deleteCheckedFiles() {
  const checkboxes = document.querySelectorAll(
    '#fileList input[type="checkbox"]:checked'
  );
  // const checkboxes = document.querySelectorAll('.fileCheckbox');
  const filesToDelete = Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  console.log("Files to delete:", filesToDelete);

  // Make a POST request to delete the files
  fetch("/deleteFile/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: filesToDelete }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
      // Refresh the file list after deletion
      location.reload();
    })
    .catch((error) => console.error("Error deleting files:", error));
}

function confirmFileDeletion() {
  const checkboxes = document.querySelectorAll(
    '#fileList input[type="checkbox"]:checked'
  );
  const filesToDelete = Array.from(checkboxes).map(
    (checkbox) => checkbox.value
  );

  if (filesToDelete.length > 0) {
    // Display a confirmation dialog or directly delete files
    deleteCheckedFiles();
  } else {
    // Provide feedback to the user (e.g., show an alert)
    alert("No files selected for deletion.");
  }
}

function goToFilesPage() {
  window.location.href = "/filesPage";
}

// fileExplorer.js
function downloadFile(filename) {
  // Trigger a download for a single file
  const downloadLink = document.createElement("a");
  downloadLink.href = `/download/${filename}`;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function downloadCheckedFiles() {
  const checkboxes = document.querySelectorAll(
    '#fileList input[type="checkbox"]:checked'
  );
  const filesToDownload = Array.from(checkboxes).map(
    (checkbox) => checkbox.value
  );

  console.log("Files to download:", filesToDownload);

  if (filesToDownload.length > 0) {
    // Make a POST request to download the files
    fetch("/downloadFiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: filesToDownload }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error downloading files: ${response.statusText}`);
        }
        return response.blob();
      })
      .then((blob) => {
        // Create a temporary link element to trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "downloaded_files.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => console.error("Error downloading files:", error));
  } else {
    // Provide feedback to the user (e.g., show an alert)
    alert("No files selected for download.");
  }
}
