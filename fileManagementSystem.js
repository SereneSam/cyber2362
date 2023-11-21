const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, 'uploaded_files');

const addFile = (fileName, content) => {
    const filePath = path.join(uploadPath, fileName);
    fs.writeFileSync(filePath, content);
    console.log(`File "${fileName}" created successfully.`);
};

const deleteFile = (fileName) => {
    const filePath = path.join(uploadPath, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File "${fileName}" deleted successfully.`);
    } else {
        console.log(`File "${fileName}" not found.`);
    }
};

const listFiles = () => {
    const files = fs.readdirSync(uploadPath);
    console.log('List of files:');
    files.forEach(file => console.log(file));
};

module.exports = {
    addFile,
    deleteFile,
    listFiles,
};
