// confirmationDialog.js

// document.getElementById('confirmationDialogContainer').innerHTML = '<object type="text/html" data="confirmationDialog.html"></object>';

let filesToDelete = []; // This variable stores the selected files

function deleteFiles() {
  // Check if filesToDelete array is not empty
  if (filesToDelete.length > 0) {
    // Perform delete operation using fetch or other method
    fetch("/deleteFiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: filesToDelete }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        location.reload(); // You might want to update this based on your UI
      })
      .catch((error) => console.error("Error deleting files:", error));

    closeConfirmationDialog();
  } else {
    // Provide feedback to the user (e.g., show an alert)
    alert("No files selected for deletion.");
  }
}

function confirmFileDeletion() {
  // Add your logic to populate filesToDelete array based on selected files
  // For example, if you have checkboxes with class 'fileCheckbox'
  const checkboxes = document.querySelectorAll(".fileCheckbox");

  filesToDelete = Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  // Check if filesToDelete array is not empty
  if (filesToDelete.length > 0) {
    openConfirmationDialog();
  } else {
    // Provide feedback to the user (e.g., show an alert)
    alert("No files selected for deletion.");
  }
}

// Additional functions for managing the confirmation dialog
// ...

document.addEventListener("DOMContentLoaded", () => {
  // Additional initialization logic if needed
  // ...
});

function closeConfirmationDialog() {
  document.getElementById("confirmationDialogContainer").style.display = "none";
}

function openConfirmationDialog(fileName) {
  document.getElementById("fileNameToDelete").textContent = fileName;
  document.getElementById("confirmationDialogContainer").style.display =
    "block";
}

document.addEventListener("DOMContentLoaded", () => {
  confirmFileDeletion();

  console.log("get it wodkd");
  const filesToDeleteList = document.getElementById("filesToDeleteList");

  filesToDelete.forEach((file) => {
    const listItem = document.createElement("li");
    listItem.textContent = file;
    filesToDeleteList.appendChild(listItem);
  });
});
