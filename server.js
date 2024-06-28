const express = require('express');
const path = require('path');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


//const chalk = require('chalk');
const PORT = 42069;

app.get('/', (req, res) => {
    res.render('html/index');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});