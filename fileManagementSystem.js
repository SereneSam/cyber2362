const fs = require('fs');

const addFile = (fileName, content) => {
    fs.writeFileSync(fileName, content);
    console.log(`File "${fileName}" created successfully.`);
};

const deleteFile = (fileName) => {
    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
        console.log(`File "${fileName}" deleted successfully.`);
    } else {
        console.log(`File "${fileName}" not found.`);
    }
};

const listFiles = () => {
    const files = fs.readdirSync(__dirname);
    console.log('List of files:');
    files.forEach(file => console.log(file));
};

module.exports = {
    addFile,
    deleteFile,
    listFiles,
};
