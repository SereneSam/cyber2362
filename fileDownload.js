const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, 'uploaded_files');

app.get('/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(uploadPath, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, fileName, (err) => {
            if (err) {
                // Handle error, but keep in mind the response may be partially-sent
                // so check res.headersSent
                console.error(err);
                if (!res.headersSent) {
                    res.status(500).send("Error occurred while downloading the file.");
                }
            }
        });
    } else {
        res.status(404).send("File not found.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

/* so for this to work I had to download express (npm install express) so it can add routes for downloading files
this also adds express file upload to the package-lock.json, package.json, and .package-lock.json
the first four line of const are just setting that up
I made this it's own file so I don't break anyone elses files and it stay here or be added to the file management file 
this is just a start I am going to need to work with someone to get the acutall button to work and hammer out specifics 
and please if you think there is a better way to do this or if this will not work tell me "this shit it wrong" will not hurt my feelings

*/
